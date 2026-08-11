"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Search, Trash2, CheckCircle2, Truck, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/app-shell/page-header"
import { StatusBadge } from "@/components/status-badge"
import { formatCurrency, formatDate } from "@/lib/format"
import { confirmChallan, deleteChallan, markDelivered, cancelChallan } from "@/app/actions/challans"
import type { ChallanRow } from "@/lib/types"

export function ChallansClient({
  challans,
  canManage,
}: {
  challans: ChallanRow[]
  canManage: boolean
}) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [busyId, setBusyId] = useState<number | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return challans.filter((c) => {
      const matchesQuery =
        !q ||
        c.challanNumber.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q)
      const matchesStatus = statusFilter === "all" || c.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [challans, query, statusFilter])

  const runAction = async (action: () => Promise<void>, label: string) => {
    setBusyId(null)
    try {
      await action()
      toast.success(label)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed")
    }
  }

  const handleConfirm = async (id: number) => {
    setBusyId(id)
    await runAction(() => confirmChallan(id), "Challan confirmed")
  }

  const handleDeliver = async (id: number) => {
    setBusyId(id)
    await runAction(() => markDelivered(id), "Challan marked delivered")
  }

  const handleCancel = async (id: number) => {
    setBusyId(id)
    await runAction(() => cancelChallan(id), "Challan cancelled")
  }

  const handleDelete = async (id: number) => {
    setBusyId(id)
    await runAction(() => deleteChallan(id), "Challan deleted")
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Sales Challans"
        description="Create, confirm, and track delivery challans for your customers."
      >
        {canManage && (
          <Button asChild>
            <Link href="/challans/new">
              <Plus className="size-4" />
              New challan
            </Link>
          </Button>
        )}
      </PageHeader>

      <div className="space-y-4 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search challan or customer"
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(["all", "Draft", "Confirmed", "Delivered", "Cancelled"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {s === "all" ? "All statuses" : s}
              </button>
            ))}
          </div>
        </div>

        <Card className="overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Challan</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Qty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No challans found.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((challan) => (
                <TableRow key={challan.id}>
                  <TableCell>
                    <Link href={`/challans/${challan.id}`} className="block">
                      <p className="font-medium hover:text-primary">{challan.challanNumber}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(challan.totalAmount)}</p>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{challan.customerName}</p>
                    <p className="text-xs text-muted-foreground">{challan.customerSnapshot?.businessName || "—"}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell tabular-nums">{challan.totalQuantity}</TableCell>
                  <TableCell>
                    <StatusBadge status={challan.status} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {formatDate(challan.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/challans/${challan.id}`}>View</Link>
                      </Button>
                      {canManage && challan.status === "Draft" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleConfirm(challan.id)}
                            disabled={busyId === challan.id}
                          >
                            <CheckCircle2 className="mr-1.5 size-4" />
                            Confirm
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancel(challan.id)}
                            disabled={busyId === challan.id}
                          >
                            <XCircle className="mr-1.5 size-4" />
                            Cancel
                          </Button>
                        </>
                      )}
                      {canManage && challan.status === "Confirmed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeliver(challan.id)}
                          disabled={busyId === challan.id}
                        >
                          <Truck className="mr-1.5 size-4" />
                          Deliver
                        </Button>
                      )}
                      {canManage && challan.status === "Draft" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(challan.id)}
                          disabled={busyId === challan.id}
                        >
                          <Trash2 className="mr-1.5 size-4" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}
