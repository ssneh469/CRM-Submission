import { redirect } from "next/navigation"
import { requireUser } from "@/lib/session"
import { canAccess } from "@/lib/rbac"
import { getCustomers } from "@/app/actions/customers"
import { CustomersClient } from "@/components/customers/customers-client"
import type { CustomerRow } from "@/lib/types"

export default async function CustomersPage() {
  const user = await requireUser()
  if (!canAccess(user.role, "customers")) redirect("/")
  const customers = (await getCustomers()) as unknown as CustomerRow[]
  return <CustomersClient customers={customers} />
}
