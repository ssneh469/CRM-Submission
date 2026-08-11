import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, Mail, Phone, MapPin, Building2, ReceiptText } from "lucide-react"
import { requireUser } from "@/lib/session"
import { canAccess } from "@/lib/rbac"
import { getCustomer } from "@/app/actions/customers"
import { StatusBadge } from "@/components/status-badge"
import { PageHeader } from "@/components/app-shell/page-header"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/format"
import {
  NotesTimeline,
  StatusChanger,
} from "@/components/customers/customer-detail-client"
import type { CustomerNoteRow } from "@/lib/types"

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireUser()
  if (!canAccess(user.role, "customers")) redirect("/")

  const { id } = await params
  const data = await getCustomer(Number(id))
  if (!data) notFound()

  const { customer, notes } = data
  const detailItems = [
    { icon: Phone, label: "Mobile", value: customer.mobile },
    { icon: Mail, label: "Email", value: customer.email || "—" },
    { icon: Building2, label: "Business", value: customer.businessName || "—" },
    { icon: ReceiptText, label: "GST", value: customer.gstNumber || "—" },
    { icon: MapPin, label: "Address", value: customer.address || "—" },
  ]

  return (
    <div>
      <PageHeader title={customer.name} description={customer.businessName || "Individual customer"}>
        <StatusChanger customerId={customer.id} status={customer.status} />
      </PageHeader>

      <div className="p-6">
        <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground">
          <Link href="/customers">
            <ArrowLeft className="size-4" />
            Back to customers
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-1">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold tracking-tight">Details</h2>
                <StatusBadge status={customer.customerType} />
              </div>
              <dl className="mt-4 space-y-3">
                {detailItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="flex items-start gap-3">
                      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <dt className="text-xs text-muted-foreground">{item.label}</dt>
                        <dd className="text-sm break-words">{item.value}</dd>
                      </div>
                    </div>
                  )
                })}
              </dl>
              <div className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
                <p>Next follow-up: {formatDate(customer.followUpDate)}</p>
                <p className="mt-1">Added by {customer.createdByName || "—"}</p>
              </div>
              {customer.notes && (
                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground">Profile note</p>
                  <p className="mt-1 text-sm leading-relaxed">{customer.notes}</p>
                </div>
              )}
            </Card>
          </div>

          <div className="lg:col-span-2">
            <NotesTimeline
              customerId={customer.id}
              notes={notes as unknown as CustomerNoteRow[]}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
