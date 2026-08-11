"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Plus, Trash2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createChallan, type ChallanLineInput } from "@/app/actions/challans"
import type { CustomerRow, ProductRow } from "@/lib/types"
import { formatCurrency } from "@/lib/format"

type LineState = {
  productId: string
  quantity: string
}

export function ChallanForm({
  customers,
  products,
}: {
  customers: CustomerRow[]
  products: ProductRow[]
}) {
  const router = useRouter()
  const [customerId, setCustomerId] = useState("")
  const [lines, setLines] = useState<LineState[]>([{ productId: "", quantity: "1" }])
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = useMemo(() => !!customerId && lines.some((line) => line.productId), [customerId, lines])

  const updateLine = (index: number, patch: Partial<LineState>) => {
    setLines((current) => current.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line)))
  }

  const addLine = () => {
    setLines((current) => [...current, { productId: "", quantity: "1" }])
  }

  const removeLine = (index: number) => {
    setLines((current) => (current.length === 1 ? [{ productId: "", quantity: "1" }] : current.filter((_, lineIndex) => lineIndex !== index)))
  }

  const submit = async (confirm: boolean) => {
    if (!customerId) {
      toast.error("Choose a customer before creating a challan")
      return
    }

    const nextLines: ChallanLineInput[] = lines
      .filter((line) => line.productId)
      .map((line) => ({
        productId: Number(line.productId),
        quantity: Number(line.quantity),
      }))

    if (!nextLines.length) {
      toast.error("Add at least one product to the challan")
      return
    }

    const invalid = nextLines.some((line) => !Number.isInteger(line.quantity) || line.quantity <= 0)
    if (invalid) {
      toast.error("Quantities must be positive whole numbers")
      return
    }

    const overStock = nextLines.some((line) => {
      const product = products.find((item) => item.id === line.productId)
      return Boolean(product && line.quantity > product.currentStock)
    })

    if (confirm && overStock) {
      toast.error("One or more selected quantities exceed available stock")
      return
    }

    setSubmitting(true)
    try {
      const challan = await createChallan(Number(customerId), nextLines, confirm)
      toast.success(confirm ? "Challan confirmed" : "Challan saved as draft")
      router.push(confirm ? `/challans/${challan.id}` : "/challans")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to save challan")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="customer">Customer *</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger id="customer" className="w-full">
                <SelectValue placeholder="Select a customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={String(customer.id)}>
                    {customer.name} {customer.businessName ? `• ${customer.businessName}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Products</h2>
            <p className="text-sm text-muted-foreground">Add lines, choose products, and set quantities.</p>
          </div>
          <Button type="button" variant="outline" onClick={addLine}>
            <Plus className="mr-1.5 size-4" />
            Add row
          </Button>
        </div>

        <div className="mt-6 space-y-4">
          {lines.map((line, index) => {
            const selectedProduct = products.find((product) => product.id === Number(line.productId))
            const exceedsStock = Boolean(selectedProduct && Number(line.quantity) > selectedProduct.currentStock)
            return (
              <div key={index} className="rounded-lg border border-border p-4">
                <div className="grid gap-4 md:grid-cols-[1.7fr_0.7fr_auto]">
                  <div className="flex flex-col gap-2">
                    <Label>Product</Label>
                    <Select value={line.productId} onValueChange={(value) => updateLine(index, { productId: value })}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={String(product.id)}>
                            {product.name} · {product.sku}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={line.quantity}
                      onChange={(event) => updateLine(index, { quantity: event.target.value })}
                    />
                  </div>

                  <div className="flex items-end">
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeLine(index)}>
                      <Trash2 className="size-4" />
                      <span className="sr-only">Remove row</span>
                    </Button>
                  </div>
                </div>

                {selectedProduct && (
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span>Unit price: {formatCurrency(selectedProduct.unitPrice)}</span>
                    <span>Available stock: {selectedProduct.currentStock}</span>
                    {exceedsStock && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-1 text-amber-700">
                        <AlertTriangle className="size-3.5" />
                        Quantity exceeds available stock
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => submit(false)} disabled={submitting || !canSubmit}>
          {submitting ? "Saving..." : "Save as Draft"}
        </Button>
        <Button type="button" onClick={() => submit(true)} disabled={submitting || !canSubmit}>
          {submitting ? "Saving..." : "Confirm Challan"}
        </Button>
      </div>
    </div>
  )
}
