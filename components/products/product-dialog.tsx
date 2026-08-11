"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  createProduct,
  updateProduct,
  type ProductInput,
} from "@/app/actions/products"
import type { ProductRow } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function ProductDialog({
  open,
  onOpenChange,
  product,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  product?: ProductRow | null
}) {
  const editing = Boolean(product)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    category: product?.category ?? "",
    unitPrice: product?.unitPrice ?? "0",
    currentStock: String(product?.currentStock ?? 0),
    minStockAlert: String(product?.minStockAlert ?? 0),
    location: product?.location ?? "",
  })

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.sku.trim()) {
      toast.error("Name and SKU are required")
      return
    }
    const payload: ProductInput = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      category: form.category.trim(),
      unitPrice: form.unitPrice || "0",
      currentStock: Number(form.currentStock) || 0,
      minStockAlert: Number(form.minStockAlert) || 0,
      location: form.location.trim(),
    }
    setSaving(true)
    try {
      if (editing && product) {
        await updateProduct(product.id, payload)
        toast.success("Product updated")
      } else {
        await createProduct(payload)
        toast.success("Product added")
      }
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit product" : "Add product"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update product details. Adjust stock levels from the product's stock panel."
              : "Add a product to your inventory. Opening stock is logged as a movement."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="name">Product name *</Label>
            <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sku">SKU *</Label>
            <Input id="sku" value={form.sku} onChange={(e) => set("sku", e.target.value)} required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="category">Category</Label>
            <Input id="category" value={form.category} onChange={(e) => set("category", e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="price">Unit price (INR)</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={form.unitPrice}
              onChange={(e) => set("unitPrice", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="location">Location / bin</Label>
            <Input id="location" value={form.location} onChange={(e) => set("location", e.target.value)} />
          </div>
          {!editing && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="stock">Opening stock</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={form.currentStock}
                onChange={(e) => set("currentStock", e.target.value)}
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="min">Low-stock alert at</Label>
            <Input
              id="min"
              type="number"
              min="0"
              value={form.minStockAlert}
              onChange={(e) => set("minStockAlert", e.target.value)}
            />
          </div>

          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : editing ? "Save changes" : "Add product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
