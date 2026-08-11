import { db } from "@/lib/db"
import { challans, customers, products, stockMovements } from "@/lib/db/schema"
import { desc } from "drizzle-orm"

export async function getDashboardData() {
  const [
    customerRows,
    productRows,
    challanRows,
    recentMovements,
    recentChallans,
  ] = await Promise.all([
    db.select().from(customers),
    db.select().from(products),
    db.select().from(challans),
    db.select().from(stockMovements).orderBy(desc(stockMovements.createdAt)).limit(6),
    db.select().from(challans).orderBy(desc(challans.createdAt)).limit(5),
  ])

  const pipeline = customerRows.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1
    return acc
  }, {})

  const lowStock = productRows.filter((p) => p.currentStock <= p.minStockAlert)
  const inventoryValue = productRows.reduce(
    (sum, p) => sum + Number(p.unitPrice) * p.currentStock,
    0,
  )
  const challanRevenue = challanRows
    .filter((c) => c.status !== "Draft")
    .reduce((sum, c) => sum + Number(c.totalAmount), 0)

  return {
    totals: {
      customers: customerRows.length,
      leads: pipeline["Lead"] ?? 0,
      products: productRows.length,
      lowStockCount: lowStock.length,
      challans: challanRows.length,
      draftChallans: challanRows.filter((c) => c.status === "Draft").length,
      inventoryValue,
      challanRevenue,
    },
    pipeline,
    lowStock: lowStock.slice(0, 6),
    recentMovements,
    recentChallans,
  }
}
