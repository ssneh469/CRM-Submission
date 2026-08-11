"use server"

import { db } from "@/lib/db"
import { customers, customerNotes } from "@/lib/db/schema"
import { getSessionUser } from "@/lib/session"
import { canAccess } from "@/lib/rbac"
import { and, desc, eq, ilike, or } from "drizzle-orm"
import { revalidatePath } from "next/cache"

async function guard() {
  const user = await getSessionUser()
  if (!user) throw new Error("Unauthorized")
  if (!canAccess(user.role, "customers")) throw new Error("Forbidden")
  return user
}

export type CustomerInput = {
  name: string
  mobile: string
  email?: string
  businessName?: string
  gstNumber?: string
  customerType: string
  address?: string
  status: string
  followUpDate?: string | null
  notes?: string
}

export async function getCustomers(query?: string, status?: string) {
  await guard()
  const conditions = []
  if (query) {
    conditions.push(
      or(
        ilike(customers.name, `%${query}%`),
        ilike(customers.mobile, `%${query}%`),
        ilike(customers.businessName, `%${query}%`),
      ),
    )
  }
  if (status && status !== "all") {
    conditions.push(eq(customers.status, status))
  }
  return db
    .select()
    .from(customers)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(customers.updatedAt))
}

export async function getCustomer(id: number) {
  await guard()
  const [customer] = await db.select().from(customers).where(eq(customers.id, id))
  if (!customer) return null
  const notes = await db
    .select()
    .from(customerNotes)
    .where(eq(customerNotes.customerId, id))
    .orderBy(desc(customerNotes.createdAt))
  return { customer, notes }
}

export async function createCustomer(input: CustomerInput) {
  const user = await guard()
  const [row] = await db
    .insert(customers)
    .values({
      name: input.name,
      mobile: input.mobile,
      email: input.email || null,
      businessName: input.businessName || null,
      gstNumber: input.gstNumber || null,
      customerType: input.customerType,
      address: input.address || null,
      status: input.status,
      followUpDate: input.followUpDate || null,
      notes: input.notes || null,
      createdBy: user.id,
      createdByName: user.name,
    })
    .returning()
  revalidatePath("/customers")
  revalidatePath("/")
  return row
}

export async function updateCustomer(id: number, input: CustomerInput) {
  await guard()
  await db
    .update(customers)
    .set({
      name: input.name,
      mobile: input.mobile,
      email: input.email || null,
      businessName: input.businessName || null,
      gstNumber: input.gstNumber || null,
      customerType: input.customerType,
      address: input.address || null,
      status: input.status,
      followUpDate: input.followUpDate || null,
      notes: input.notes || null,
      updatedAt: new Date(),
    })
    .where(eq(customers.id, id))
  revalidatePath("/customers")
  revalidatePath(`/customers/${id}`)
  revalidatePath("/")
}

export async function updateCustomerStatus(id: number, status: string) {
  await guard()
  await db
    .update(customers)
    .set({ status, updatedAt: new Date() })
    .where(eq(customers.id, id))
  revalidatePath("/customers")
  revalidatePath(`/customers/${id}`)
  revalidatePath("/")
}

export async function deleteCustomer(id: number) {
  await guard()
  await db.delete(customerNotes).where(eq(customerNotes.customerId, id))
  await db.delete(customers).where(eq(customers.id, id))
  revalidatePath("/customers")
  revalidatePath("/")
}

export async function addCustomerNote(
  customerId: number,
  note: string,
  followUpDate?: string | null,
) {
  const user = await guard()
  await db.insert(customerNotes).values({
    customerId,
    note,
    followUpDate: followUpDate || null,
    createdBy: user.id,
    createdByName: user.name,
  })
  if (followUpDate) {
    await db
      .update(customers)
      .set({ followUpDate, updatedAt: new Date() })
      .where(eq(customers.id, customerId))
  }
  revalidatePath(`/customers/${customerId}`)
  revalidatePath("/customers")
}
