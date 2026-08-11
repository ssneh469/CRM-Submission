"use server"

import { db } from "@/lib/db"
import { products, stockMovements } from "@/lib/db/schema"
import { getSessionUser } from "@/lib/session"
import { canAccess } from "@/lib/rbac"
import { and, desc, eq, ilike, or, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

async function guard() {
  const user = await getSessionUser()
  if (!user) throw new Error("Unauthorized")
  if (!canAccess(user.role, "products")) throw new Error("Forbidden")
  return user
}

export type ProductInput = {
  name: string
  sku: string
  category?: string
  unitPrice: string
  currentStock: number
  minStockAlert: number
  location?: string
}

export async function getProducts(query?: string, lowStockOnly?: boolean) {
  await guard()
  const conditions = []
  if (query) {
    conditions.push(
      or(
        ilike(products.name, `%${query}%`),
        ilike(products.sku, `%${query}%`),
        ilike(products.category, `%${query}%`),
      ),
    )
  }
  if (lowStockOnly) {
    conditions.push(sql`${products.currentStock} <= ${products.minStockAlert}`)
  }
  return db
    .select()
    .from(products)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(products.updatedAt))
}

export async function getProduct(id: number) {
  await guard()
  const [product] = await db.select().from(products).where(eq(products.id, id))
  if (!product) return null
  const movements = await getStockMovements(id)
  return { product, movements }
}

export async function getStockMovements(productId: number) {
  await guard()
  return db
    .select()
    .from(stockMovements)
    .where(eq(stockMovements.productId, productId))
    .orderBy(desc(stockMovements.createdAt))
    .limit(50)
}

export async function createProduct(input: ProductInput) {
  const user = await guard()
  const [row] = await db
    .insert(products)
    .values({
      name: input.name,
      sku: input.sku,
      category: input.category || null,
      unitPrice: input.unitPrice,
      currentStock: input.currentStock,
      minStockAlert: input.minStockAlert,
      location: input.location || null,
      createdBy: user.id,
      createdByName: user.name,
    })
    .returning()

  if (input.currentStock > 0) {
    await db.insert(stockMovements).values({
      productId: row.id,
      productName: row.name,
      quantity: input.currentStock,
      movementType: "IN",
      reason: "Opening stock",
      createdBy: user.id,
      createdByName: user.name,
    })
  }
  revalidatePath("/products")
  revalidatePath("/")
  return row
}

export async function updateProduct(id: number, input: ProductInput) {
  await guard()
  // Do not overwrite currentStock here — stock changes go through adjustStock.
  await db
    .update(products)
    .set({
      name: input.name,
      sku: input.sku,
      category: input.category || null,
      unitPrice: input.unitPrice,
      minStockAlert: input.minStockAlert,
      location: input.location || null,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id))
  revalidatePath("/products")
  revalidatePath(`/products/${id}`)
  revalidatePath("/")
}

export async function deleteProduct(id: number) {
  await guard()
  await db.delete(stockMovements).where(eq(stockMovements.productId, id))
  await db.delete(products).where(eq(products.id, id))
  revalidatePath("/products")
  revalidatePath("/")
}

export async function adjustStock(
  productId: number,
  movementType: "IN" | "OUT",
  quantity: number,
  reason?: string,
) {
  const user = await guard()
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("Quantity must be a positive whole number")
  }
  const [product] = await db.select().from(products).where(eq(products.id, productId))
  if (!product) throw new Error("Product not found")

  const delta = movementType === "IN" ? quantity : -quantity
  const newStock = product.currentStock + delta
  if (newStock < 0) throw new Error("Insufficient stock for this movement")

  await db
    .update(products)
    .set({ currentStock: newStock, updatedAt: new Date() })
    .where(eq(products.id, productId))

  await db.insert(stockMovements).values({
    productId,
    productName: product.name,
    quantity,
    movementType,
    reason: reason || null,
    createdBy: user.id,
    createdByName: user.name,
  })
  revalidatePath("/products")
  revalidatePath(`/products/${productId}`)
  revalidatePath("/")
}
