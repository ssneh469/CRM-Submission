import Link from "next/link"
import { requireUser } from "@/lib/session"
import { getDashboardData } from "@/app/actions/dashboard"
import { canAccess } from "@/lib/rbac"
import { PageHeader } from "@/components/app-shell/page-header"
import { StatusBadge } from "@/components/status-badge"
import { formatCurrency, formatDateTime } from "@/lib/format"
import { Card } from "@/components/ui/card"
import {
  Users,
  Package,
  Truck,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  IndianRupee,
} from "lucide-react"

const PIPELINE_ORDER = ["Lead", "Prospect", "Customer", "Inactive"]

export default async function DashboardPage() {
  const user = await requireUser()
  const data = await getDashboardData()
  const t = data.totals

  const totalPipeline = Object.values(data.pipeline).reduce((a, b) => a + b, 0) || 1

  const stats = [
    {
      label: "Customers",
      value: t.customers,
      sub: `${t.leads} active leads`,
      icon: Users,
      href: "/customers",
      show: canAccess(user.role, "customers"),
    },
    {
      label: "Products",
      value: t.products,
      sub: `${formatCurrency(t.inventoryValue)} on hand`,
      icon: Package,
      href: "/products",
      show: canAccess(user.role, "products"),
    },
    {
      label: "Low stock alerts",
      value: t.lowStockCount,
      sub: "at or below minimum",
      icon: AlertTriangle,
      href: "/products?low=1",
      show: canAccess(user.role, "products"),
      alert: t.lowStockCount > 0,
    },
    {
      label: "Challans",
      value: t.challans,
      sub: `${t.draftChallans} in draft`,
      icon: Truck,
      href: "/challans",
      show: canAccess(user.role, "challans"),
    },
    {
      label: "Dispatched value",
      value: formatCurrency(t.challanRevenue),
      sub: "confirmed + delivered",
      icon: IndianRupee,
      href: "/challans",
      show: canAccess(user.role, "challans"),
      isText: true,
    },
  ].filter((s) => s.show)

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="Here's what's happening across the business today."
      />

      <div className="p-6 space-y-6">
        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((s) => {
            const Icon = s.icon
            return (
              <Link key={s.label} href={s.href}>
                <Card className="p-5 transition-colors hover:border-primary/40">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                      <p className="text-2xl font-semibold tracking-tight tabular-nums">
                        {s.value}
                      </p>
                      <p
                        className={
                          s.alert
                            ? "text-xs font-medium text-destructive"
                            : "text-xs text-muted-foreground"
                        }
                      >
                        {s.sub}
                      </p>
                    </div>
                    <div
                      className={
                        s.alert
                          ? "flex size-9 items-center justify-center rounded-lg bg-destructive/15 text-destructive"
                          : "flex size-9 items-center justify-center rounded-lg bg-secondary text-foreground"
                      }
                    >
                      <Icon className="size-4" />
                    </div>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Pipeline */}
          {canAccess(user.role, "customers") && (
            <Card className="p-5 lg:col-span-1">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold tracking-tight">Sales pipeline</h2>
                <Link href="/customers" className="text-xs text-primary hover:underline">
                  View all
                </Link>
              </div>
              <div className="mt-4 space-y-4">
                {PIPELINE_ORDER.map((stage) => {
                  const count = data.pipeline[stage] ?? 0
                  const pct = Math.round((count / totalPipeline) * 100)
                  return (
                    <div key={stage} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <StatusBadge status={stage} />
                        <span className="tabular-nums text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Recent challans */}
          {canAccess(user.role, "challans") && (
            <Card className="p-5 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold tracking-tight">Recent challans</h2>
                <Link href="/challans" className="text-xs text-primary hover:underline">
                  View all
                </Link>
              </div>
              <div className="mt-4 divide-y divide-border">
                {data.recentChallans.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No challans yet.
                  </p>
                )}
                {data.recentChallans.map((c) => (
                  <Link
                    key={c.id}
                    href={`/challans/${c.id}`}
                    className="flex items-center justify-between gap-4 py-3 first:pt-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{c.customerName}</p>
                      <p className="font-mono text-xs text-muted-foreground">
                        {c.challanNumber}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="hidden text-sm tabular-nums text-muted-foreground sm:block">
                        {formatCurrency(c.totalAmount)}
                      </span>
                      <StatusBadge status={c.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Low stock */}
          {canAccess(user.role, "products") && (
            <Card className="p-5 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold tracking-tight">Low stock</h2>
                <Link href="/products?low=1" className="text-xs text-primary hover:underline">
                  Manage
                </Link>
              </div>
              <div className="mt-4 divide-y divide-border">
                {data.lowStock.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Everything is well stocked.
                  </p>
                )}
                {data.lowStock.map((p) => (
                  <div key={p.id} className="flex items-center justify-between gap-4 py-3 first:pt-0">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{p.sku}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-destructive tabular-nums">
                        {p.currentStock}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        / min {p.minStockAlert}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recent stock movements */}
          {canAccess(user.role, "products") && (
            <Card className="p-5 lg:col-span-1">
              <h2 className="font-semibold tracking-tight">Stock activity</h2>
              <div className="mt-4 space-y-3">
                {data.recentMovements.length === 0 && (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No stock movements yet.
                  </p>
                )}
                {data.recentMovements.map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <div
                      className={
                        m.movementType === "IN"
                          ? "flex size-7 items-center justify-center rounded-md bg-chart-2/15 text-chart-2"
                          : "flex size-7 items-center justify-center rounded-md bg-chart-4/15 text-chart-4"
                      }
                    >
                      {m.movementType === "IN" ? (
                        <ArrowDownRight className="size-4" />
                      ) : (
                        <ArrowUpRight className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{m.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(m.createdAt)}
                      </p>
                    </div>
                    <span className="text-sm font-medium tabular-nums">
                      {m.movementType === "IN" ? "+" : "-"}
                      {m.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
