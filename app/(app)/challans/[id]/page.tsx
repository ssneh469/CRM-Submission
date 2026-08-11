import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft, Package, Phone, Building2, MapPin, ReceiptText } from "lucide-react"
import { requireUser } from "@/lib/session"
import { canAccess } from "@/lib/rbac"
import { confirmChallan, getChallan, markDelivered } from "@/app/actions/challans"
import { PageHeader } from "@/components/app-shell/page-header"
import { StatusBadge } from "@/components/status-badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDateTime } from "@/lib/format"
import type { ChallanItemRow, ChallanRow } from "@/lib/types"

async function confirmAction(id: number) {
  "use server"
  await confirmChallan(id)
}

async function deliverAction(id: number) {
  "use server"
  await markDelivered(id)
}

export default async function ChallanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  if (!canAccess(user.role, "challans")) redirect("/")

  const { id } = await params
  const data = await getChallan(Number(id))
  if (!data) notFound()

  const challan = data.challan as unknown as ChallanRow
  const items = data.items as unknown as ChallanItemRow[]
  const snapshot = challan.customerSnapshot

  return (
    <div className="space-y-6">
      <PageHeader
        title={challan.challanNumber}
        description={`Customer: ${challan.customerName}`}
      >
        <div className="flex items-center gap-2">
          <StatusBadge status={challan.status} />
          <Button asChild variant="outline" size="sm">
            <Link href="/challans">
              <ArrowLeft className="mr-1.5 size-4" />
              Back to challans
            </Link>
          </Button>
        </div>
      </PageHeader>

      <div className="px-6 space-y-6">
        <div className="flex flex-wrap gap-3">
          {challan.status === "Draft" && (
            <form action={confirmAction.bind(null, challan.id)}>
              <Button type="submit">Confirm challan</Button>
            </form>
          )}
          {challan.status === "Confirmed" && (
            <form action={deliverAction.bind(null, challan.id)}>
              <Button type="submit">Mark delivered</Button>
            </form>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="p-5">
            <h2 className="text-lg font-semibold tracking-tight">Customer snapshot</h2>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <Building2 className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Customer</p>
                  <p className="font-medium">{snapshot?.name || challan.customerName}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Mobile</p>
                  <p>{snapshot?.mobile || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <ReceiptText className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">GST</p>
                  <p>{snapshot?.gstNumber || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Address</p>
                  <p>{snapshot?.address || "—"}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">Challan summary</h2>
              <p className="text-sm text-muted-foreground">Created {formatDateTime(challan.createdAt)}</p>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total quantity</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{challan.totalQuantity}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total amount</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{formatCurrency(challan.totalAmount)}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                <div className="mt-2">
                  <StatusBadge status={challan.status} />
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex items-center gap-2">
            <Package className="size-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold tracking-tight">Line items</h2>
          </div>
          <div className="mt-4 overflow-hidden rounded-lg border border-border">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Unit price</th>
                  <th className="px-4 py-3 font-medium">Quantity</th>
                  <th className="px-4 py-3 font-medium">Line total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium">{item.productName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.productSku}</td>
                    <td className="px-4 py-3 tabular-nums">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-3 tabular-nums">{item.quantity}</td>
                    <td className="px-4 py-3 tabular-nums">{formatCurrency(Number(item.unitPrice) * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
