import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { requireUser } from "@/lib/session"
import { canAccess } from "@/lib/rbac"
import { getChallanLookups } from "@/app/actions/challans"
import { PageHeader } from "@/components/app-shell/page-header"
import { ChallanForm } from "@/components/challans/challan-form"
import type { CustomerRow, ProductRow } from "@/lib/types"

export default async function NewChallanPage() {
  const user = await requireUser()
  if (!canAccess(user.role, "challans")) redirect("/")

  const lookups = await getChallanLookups()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create sales challan"
        description="Build a draft or confirm a challan directly from customer and product selections."
      >
        <Link href="/challans" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to challans
        </Link>
      </PageHeader>

      <div className="px-6">
        <ChallanForm
          customers={lookups.customers as unknown as CustomerRow[]}
          products={lookups.products as unknown as ProductRow[]}
        />
      </div>
    </div>
  )
}
