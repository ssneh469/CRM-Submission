"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Search, Trash2, Pencil } from "lucide-react"
import { CUSTOMER_STATUSES, type CustomerRow } from "@/lib/types"
import { deleteCustomer } from "@/app/actions/customers"
import { formatDate } from "@/lib/format"
import { CustomerDialog } from "./customer-dialog"
import { StatusBadge } from "@/components/status-badge"
import { PageHeader } from "@/components/app-shell/page-header"
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
import { cn } from "@/lib/utils"

export function CustomersClient({ customers }: { customers: CustomerRow[] }) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CustomerRow | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return customers.filter((c) => {
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.mobile.toLowerCase().includes(q) ||
        (c.businessName ?? "").toLowerCase().includes(q)
      const matchesStatus = statusFilter === "all" || c.status === statusFilter
      return matchesQuery && matchesStatus
    })
  }, [customers, search, statusFilter])

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: customers.length }
    for (const s of CUSTOMER_STATUSES) map[s] = 0
    for (const c of customers) map[c.status] = (map[c.status] ?? 0) + 1
    return map
  }, [customers])

  const openAdd = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const openEdit = (c: CustomerRow) => {
    setEditing(c)
    setDialogOpen(true)
  }

  const handleDelete = async (c: CustomerRow) => {
    if (!confirm(`Delete ${c.name}? This also removes their notes.`)) return
    try {
      await deleteCustomer(c.id)
      toast.success("Customer deleted")
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed")
    }
  }

  const tabs = ["all", ...CUSTOMER_STATUSES]

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Manage leads and customers across your sales pipeline."
      >
        <Button onClick={openAdd}>
          <Plus className="size-4" />
          Add customer
        </Button>
      </PageHeader>

      <div className="p-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, mobile, business..."
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setStatusFilter(t)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  statusFilter === t
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {t === "all" ? "All" : t}
                <span className="ml-1.5 tabular-nums opacity-70">{counts[t] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>

        <Card className="overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Customer</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                <TableHead className="hidden lg:table-cell">Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Follow-up</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No customers found.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((c) => (
                <TableRow key={c.id} className="group">
                  <TableCell>
                    <Link href={`/customers/${c.id}`} className="block">
                      <p className="font-medium hover:text-primary">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.businessName || "Individual"}
                      </p>
                    </Link>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p className="text-sm">{c.mobile}</p>
                    <p className="text-xs text-muted-foreground">{c.email || "—"}</p>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {c.customerType}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {formatDate(c.followUpDate)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => openEdit(c)}
                      >
                        <Pencil className="size-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(c)}
                      >
                        <Trash2 className="size-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {dialogOpen && (
        <CustomerDialog
          key={editing?.id ?? "new"}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          customer={editing}
        />
      )}
    </div>
  )
}
