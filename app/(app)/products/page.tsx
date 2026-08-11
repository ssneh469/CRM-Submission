import { getProducts } from "@/app/actions/products"
import { getCurrentUser } from "@/lib/session"
import { can } from "@/lib/rbac"
import { PageHeader } from "@/components/app-shell/page-header"
import { ProductsClient } from "@/components/products/products-client"
import { redirect } from "next/navigation"

export default async function ProductsPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")
  if (!can(user.role, "products")) redirect("/")

  const products = await getProducts()
  const canManage = can(user.role, "products")

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Products & Inventory"
        description="Manage your catalog, track stock levels, and log inventory movements."
      />
      <ProductsClient products={products} canManage={canManage} />
    </div>
  )
}
