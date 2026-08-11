"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ProductDialog } from "./product-dialog"
import { StockDialog } from "./stock-dialog"
import { formatCurrency } from "@/lib/format"
import type { Product } from "@/lib/types"
import { Plus, Search, PackageSearch, ArrowLeftRight, Pencil, AlertTriangle } from "lucide-react"

export function ProductsClient({
  products,
  canManage,
}: {
  products: Product[]
  canManage: boolean
}) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState<string>("All")

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category).filter(Boolean) as string[]))]

  const filtered = products.filter((p) => {
    const matchesQuery =
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.toLowerCase().includes(query.toLowerCase())
    const matchesCategory = category === "All" || p.category === category
    return matchesQuery && matchesCategory
  })

  const lowStockCount = products.filter((p) => p.currentStock <= p.minStockAlert).length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or SKU"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        {canManage && (
          <ProductDialog
            trigger={
              <Button>
                <Plus className="size-4" />
                Add Product
              </Button>
            }
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              category === c
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
        {lowStockCount > 0 && (
          <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
            <AlertTriangle className="size-3.5" />
            {lowStockCount} low stock
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Location</TableHead>
              {canManage && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 7 : 6} className="h-32 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <PackageSearch className="size-8" />
                    <p className="text-sm">No products found</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p) => {
                const isLow = p.currentStock <= p.minStockAlert
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <Link href={`/products/${p.id}`} className="hover:text-primary hover:underline">
                        {p.name}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{p.sku}</TableCell>
                    <TableCell>
                      {p.category ? (
                        <Badge variant="secondary" className="font-normal">
                          {p.category}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrency(p.unitPrice)}</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`inline-flex items-center gap-1.5 tabular-nums ${
                          isLow ? "font-semibold text-destructive" : ""
                        }`}
                      >
                        {isLow && <AlertTriangle className="size-3.5" />}
                        {p.currentStock}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.location || "—"}</TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <StockDialog
                            product={p}
                            trigger={
                              <Button variant="ghost" size="icon" className="size-8" title="Adjust stock">
                                <ArrowLeftRight className="size-4" />
                              </Button>
                            }
                          />
                          <ProductDialog
                            product={p}
                            trigger={
                              <Button variant="ghost" size="icon" className="size-8" title="Edit product">
                                <Pencil className="size-4" />
                              </Button>
                            }
                          />
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
