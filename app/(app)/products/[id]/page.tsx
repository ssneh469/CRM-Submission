import { getProduct, getStockMovements } from "@/app/actions/products"
import { getCurrentUser } from "@/lib/session"
import { can } from "@/lib/rbac"
import { PageHeader } from "@/components/app-shell/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StockDialog } from "@/components/products/stock-dialog"
import { ProductDialog } from "@/components/products/product-dialog"
import { formatCurrency, formatDateTime } from "@/lib/format"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ArrowLeftRight, Pencil, AlertTriangle, TrendingUp, TrendingDown, Settings2 } from "lucide-react"

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")
  if (!can(user.role, "products")) redirect("/")

  const { id } = await params
  const product = await getProduct(Number(id))
  if (!product) notFound()

  const movements = await getStockMovements(product.id)
  const canManage = can(user.role, "products")
  const isLow = product.currentStock <= product.minStockAlert

  const stats = [
    { label: "Unit Price", value: formatCurrency(product.unitPrice) },
    { label: "Current Stock", value: String(product.currentStock), alert: isLow },
    { label: "Min Alert", value: String(product.minStockAlert) },
    { label: "Location", value: product.location || "—" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/products"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to products
      </Link>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-balance">{product.name}</h1>
            {product.category && (
              <Badge variant="secondary" className="font-normal">
                {product.category}
              </Badge>
            )}
          </div>
          <p className="font-mono text-sm text-muted-foreground">{product.sku}</p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <StockDialog
              product={product}
              trigger={
                <Button variant="outline">
                  <ArrowLeftRight className="size-4" />
                  Adjust Stock
                </Button>
              }
            />
            <ProductDialog
              product={product}
              trigger={
                <Button variant="outline">
                  <Pencil className="size-4" />
                  Edit
                </Button>
              }
            />
          </div>
        )}
      </div>

      {isLow && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4" />
          Stock is at or below the minimum alert threshold. Consider restocking.
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex flex-col gap-1 p-4">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.label}</span>
              <span
                className={`text-2xl font-semibold tabular-nums ${s.alert ? "text-destructive" : "text-foreground"}`}
              >
                {s.value}
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stock Movement History</CardTitle>
        </CardHeader>
        <CardContent>
          {movements.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No stock movements recorded yet.</p>
          ) : (
            <ol className="flex flex-col">
              {movements.map((m, i) => {
                const isIn = m.movementType === "IN"
                const isAdjust = m.movementType === "ADJUST"
                const Icon = isAdjust ? Settings2 : isIn ? TrendingUp : TrendingDown
                return (
                  <li key={m.id} className="flex gap-3 py-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={`flex size-8 items-center justify-center rounded-full ${
                          isAdjust
                            ? "bg-accent text-accent-foreground"
                            : isIn
                              ? "bg-chart-2/15 text-chart-2"
                              : "bg-destructive/15 text-destructive"
                        }`}
                      >
                        <Icon className="size-4" />
                      </span>
                      {i < movements.length - 1 && <span className="mt-1 w-px flex-1 bg-border" />}
                    </div>
                    <div className="flex flex-1 flex-col gap-0.5 pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">
                          {isAdjust ? "Adjusted" : isIn ? "Stock In" : "Stock Out"}{" "}
                          <span
                            className={`tabular-nums ${isIn ? "text-chart-2" : isAdjust ? "" : "text-destructive"}`}
                          >
                            {isIn ? "+" : isAdjust ? "" : "-"}
                            {Math.abs(m.quantity)}
                          </span>
                        </span>
                        <span className="text-xs text-muted-foreground">{formatDateTime(m.createdAt)}</span>
                      </div>
                      {m.reason && <p className="text-sm text-muted-foreground">{m.reason}</p>}
                      <span className="text-xs text-muted-foreground">by {m.createdByName || "Unknown"}</span>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
