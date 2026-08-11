"use server"

import { db } from "@/lib/db"
import {
  challans,
  challanItems,
  customers,
  products,
  stockMovements,
} from "@/lib/db/schema"
import { getSessionUser } from "@/lib/session"
import { canAccess } from "@/lib/rbac"
import { desc, eq, inArray } from "drizzle-orm"
import { revalidatePath } from "next/cache"

async function guard() {
  const user = await getSessionUser()
  if (!user) throw new Error("Unauthorized")
  if (!canAccess(user.role, "challans")) throw new Error("Forbidden")
  return user
}

// Lookups available to anyone who can build challans (Sales/Admin)
export async function getChallanLookups() {
  await guard()
  const [customerList, productList] = await Promise.all([
    db
      .select({
        id: customers.id,
        name: customers.name,
        mobile: customers.mobile,
        businessName: customers.businessName,
        gstNumber: customers.gstNumber,
        address: customers.address,
      })
      .from(customers)
      .orderBy(desc(customers.updatedAt)),
    db
      .select({
        id: products.id,
        name: products.name,
        sku: products.sku,
        unitPrice: products.unitPrice,
        currentStock: products.currentStock,
      })
      .from(products)
      .orderBy(products.name),
  ])
  return { customers: customerList, products: productList }
}

export async function getChallans() {
  await guard()
  return db.select().from(challans).orderBy(desc(challans.createdAt))
}

export async function getChallan(id: number) {
  await guard()
  const [challan] = await db.select().from(challans).where(eq(challans.id, id))
  if (!challan) return null
  const items = await db
    .select()
    .from(challanItems)
    .where(eq(challanItems.challanId, id))
  return { challan, items }
}

async function generateChallanNumber() {
  const year = new Date().getFullYear()
  const rows = await db.select({ id: challans.id }).from(challans)
  const seq = String(rows.length + 1).padStart(4, "0")
  return `CH-${year}-${seq}`
}

export type ChallanLineInput = { productId: number; quantity: number }

export async function createChallan(
  customerId: number,
  lines: ChallanLineInput[],
  confirm: boolean,
) {
  const user = await guard()

  if (!lines.length) throw new Error("Add at least one product")
  for (const l of lines) {
    if (!Number.isInteger(l.quantity) || l.quantity <= 0) {
      throw new Error("Quantities must be positive whole numbers")
    }
  }

  const [customer] = await db.select().from(customers).where(eq(customers.id, customerId))
  if (!customer) throw new Error("Customer not found")

  // Fetch products server-side; never trust client prices.
  const productIds = lines.map((l) => l.productId)
  const prods = await db.select().from(products).where(inArray(products.id, productIds))
  const byId = new Map(prods.map((p) => [p.id, p]))

  let totalQuantity = 0
  let totalAmount = 0
  const resolved = lines.map((l) => {
    const p = byId.get(l.productId)
    if (!p) throw new Error("A selected product no longer exists")
    if (confirm && l.quantity > p.currentStock) {
      throw new Error(`Insufficient stock for ${p.name} (available: ${p.currentStock})`)
    }
    const unit = Number(p.unitPrice)
    totalQuantity += l.quantity
    totalAmount += unit * l.quantity
    return { product: p, quantity: l.quantity, unit }
  })

  const challanNumber = await generateChallanNumber()

  const [challan] = await db
    .insert(challans)
    .values({
      challanNumber,
      customerId,
      customerName: customer.name,
      customerSnapshot: {
        name: customer.name,
        mobile: customer.mobile,
        businessName: customer.businessName,
        gstNumber: customer.gstNumber,
        address: customer.address,
      },
      totalQuantity,
      totalAmount: totalAmount.toFixed(2),
      status: confirm ? "Confirmed" : "Draft",
      createdBy: user.id,
      createdByName: user.name,
    })
    .returning()

  await db.insert(challanItems).values(
    resolved.map((r) => ({
      challanId: challan.id,
      productId: r.product.id,
      productName: r.product.name,
      productSku: r.product.sku,
      unitPrice: r.unit.toFixed(2),
      quantity: r.quantity,
    })),
  )

  if (confirm) {
    await decrementStock(resolved, challan.challanNumber, user.id, user.name)
  }

  revalidatePath("/challans")
  revalidatePath("/products")
  revalidatePath("/")
  return challan
}

async function decrementStock(
  resolved: { product: { id: number; name: string; currentStock: number }; quantity: number }[],
  challanNumber: string,
  userId: string,
  userName: string,
) {
  for (const r of resolved) {
    await db
      .update(products)
      .set({
        currentStock: r.product.currentStock - r.quantity,
        updatedAt: new Date(),
      })
      .where(eq(products.id, r.product.id))
    await db.insert(stockMovements).values({
      productId: r.product.id,
      productName: r.product.name,
      quantity: r.quantity,
      movementType: "OUT",
      reason: `Challan ${challanNumber}`,
      createdBy: userId,
      createdByName: userName,
    })
  }
}

export async function confirmChallan(id: number) {
  const user = await guard()
  const data = await getChallan(id)
  if (!data) throw new Error("Challan not found")
  if (data.challan.status !== "Draft") throw new Error("Only drafts can be confirmed")

  const productIds = data.items.map((i) => i.productId)
  const prods = await db.select().from(products).where(inArray(products.id, productIds))
  const byId = new Map(prods.map((p) => [p.id, p]))

  const resolved = data.items.map((i) => {
    const p = byId.get(i.productId)
    if (!p) throw new Error(`Product ${i.productName} no longer exists`)
    if (i.quantity > p.currentStock) {
      throw new Error(`Insufficient stock for ${p.name} (available: ${p.currentStock})`)
    }
    return { product: p, quantity: i.quantity }
  })

  await decrementStock(resolved, data.challan.challanNumber, user.id, user.name)
  await db
    .update(challans)
    .set({ status: "Confirmed", updatedAt: new Date() })
    .where(eq(challans.id, id))

  revalidatePath("/challans")
  revalidatePath(`/challans/${id}`)
  revalidatePath("/products")
  revalidatePath("/")
}

export async function markDelivered(id: number) {
  await guard()
  const [challan] = await db.select().from(challans).where(eq(challans.id, id))
  if (!challan) throw new Error("Challan not found")
  if (challan.status !== "Confirmed") throw new Error("Only confirmed challans can be delivered")
  await db
    .update(challans)
    .set({ status: "Delivered", updatedAt: new Date() })
    .where(eq(challans.id, id))
  revalidatePath("/challans")
  revalidatePath(`/challans/${id}`)
  revalidatePath("/")
}

export async function cancelChallan(id: number) {
  await guard()
  const [challan] = await db.select().from(challans).where(eq(challans.id, id))
  if (!challan) throw new Error("Challan not found")
  if (challan.status !== "Draft") {
    throw new Error("Only draft challans can be cancelled")
  }
  await db.update(challans).set({ status: "Cancelled", updatedAt: new Date() }).where(eq(challans.id, id))
  revalidatePath("/challans")
  revalidatePath(`/challans/${id}`)
  revalidatePath("/")
}

export async function deleteChallan(id: number) {
  await guard()
  const [challan] = await db.select().from(challans).where(eq(challans.id, id))
  if (!challan) throw new Error("Challan not found")
  if (challan.status !== "Draft") {
    throw new Error("Only draft challans can be deleted (stock already dispatched)")
  }
  await db.delete(challanItems).where(eq(challanItems.challanId, id))
  await db.delete(challans).where(eq(challans.id, id))
  revalidatePath("/challans")
  revalidatePath("/")
}
