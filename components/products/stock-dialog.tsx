"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ArrowDownRight, ArrowUpRight } from "lucide-react"
import { adjustStock } from "@/app/actions/products"
import type { ProductRow } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function StockDialog({
  open,
  onOpenChange,
  product,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  product: ProductRow | null
}) {
  const router = useRouter()
  const [type, setType] = useState<"IN" | "OUT">("IN")
  const [qty, setQty] = useState("1")
  const [reason, setReason] = useState("")
  const [saving, setSaving] = useState(false)

  if (!product) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const quantity = Number(qty)
    if (!Number.isInteger(quantity) || quantity <= 0) {
      toast.error("Enter a positive whole number")
      return
    }
    setSaving(true)
    try {
      await adjustStock(product.id, type, quantity, reason.trim() || undefined)
      toast.success(`Stock ${type === "IN" ? "added" : "removed"}`)
      setQty("1")
      setReason("")
      onOpenChange(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Adjustment failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
          <DialogDescription>
            {product.name} · current stock {product.currentStock}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType("IN")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md border py-2.5 text-sm font-medium transition-colors",
                type === "IN"
                  ? "border-chart-2/50 bg-chart-2/10 text-chart-2"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              <ArrowDownRight className="size-4" />
              Stock In
            </button>
            <button
              type="button"
              onClick={() => setType("OUT")}
              className={cn(
                "flex items-center justify-center gap-2 rounded-md border py-2.5 text-sm font-medium transition-colors",
                type === "OUT"
                  ? "border-chart-4/50 bg-chart-4/10 text-chart-4"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              <ArrowUpRight className="size-4" />
              Stock Out
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="qty">Quantity</Label>
            <Input
              id="qty"
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={type === "IN" ? "Purchase order, return..." : "Damage, sample..."}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Apply"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
