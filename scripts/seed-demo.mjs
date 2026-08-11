import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { Pool } from "pg"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, "..")
const envFile = path.join(rootDir, ".env.local")

async function loadEnvFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8")
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue
      const separatorIndex = trimmed.indexOf("=")
      if (separatorIndex === -1) continue
      const key = trimmed.slice(0, separatorIndex).trim()
      const value = trimmed.slice(separatorIndex + 1).trim()
      if (!(key in process.env)) {
        process.env[key] = value
      }
    }
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return
    }
    throw error
  }
}

async function main() {
  await loadEnvFile(envFile)
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL is required")
  }

  const pool = new Pool({ connectionString })
  const client = await pool.connect()

  const demoUserId = "demo-admin"
  const demoUserName = "Demo Admin"

  const customers = [
    {
      name: "Aarav Industries",
      mobile: "9876543210",
      email: "accounts@aaravindustries.test",
      businessName: "Aarav Industries Pvt Ltd",
      gstNumber: "27AAACA1111A1Z5",
      customerType: "Wholesale",
      address: "12 Market Road, Mumbai",
      status: "Customer",
      notes: "Regular bulk buyer for office supplies.",
    },
    {
      name: "Mehta Retail",
      mobile: "9811122233",
      email: "hello@mehtaretail.test",
      businessName: "Mehta Retail Store",
      gstNumber: "24AAACM2222B1Z2",
      customerType: "Retail",
      address: "44 Station Road, Ahmedabad",
      status: "Prospect",
      notes: "Requested pricing for new stationery line.",
    },
    {
      name: "Skyline Traders",
      mobile: "9898989898",
      email: "ops@skylinetraders.test",
      businessName: "Skyline Traders",
      gstNumber: "29AAACS3333C1Z3",
      customerType: "Distributor",
      address: "88 Industrial Area, Bengaluru",
      status: "Lead",
      notes: "Met at trade expo, asked for sample catalogue.",
    },
  ]

  const products = [
    {
      name: "Premium Copy Paper A4",
      sku: "PAPER-A4-001",
      category: "Office Supplies",
      unitPrice: "280.00",
      currentStock: 180,
      minStockAlert: 40,
      location: "A1-02",
    },
    {
      name: "Blue Ball Pen Box",
      sku: "PEN-BLUE-010",
      category: "Writing",
      unitPrice: "120.00",
      currentStock: 320,
      minStockAlert: 80,
      location: "B2-07",
    },
    {
      name: "Executive Notebook",
      sku: "NOTE-EXE-025",
      category: "Office Supplies",
      unitPrice: "95.00",
      currentStock: 145,
      minStockAlert: 30,
      location: "A1-08",
    },
    {
      name: "Desk Organizer Set",
      sku: "DESK-ORG-005",
      category: "Accessories",
      unitPrice: "540.00",
      currentStock: 52,
      minStockAlert: 15,
      location: "C3-01",
    },
  ]

  try {
    await client.query("BEGIN")

    await client.query(`
      INSERT INTO "user" ("id", "name", "email", "emailVerified", "role", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, true, 'Admin', now(), now())
      ON CONFLICT ("id") DO UPDATE
      SET "name" = EXCLUDED."name",
          "email" = EXCLUDED."email",
          "role" = EXCLUDED."role",
          "updatedAt" = now()
    `, [demoUserId, demoUserName, "demo-admin@example.com"])

    for (const customer of customers) {
      const result = await client.query(
        `
          INSERT INTO "customers"
            ("name", "mobile", "email", "businessName", "gstNumber", "customerType", "address", "status", "notes", "createdBy", "createdByName", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now(), now())
          ON CONFLICT DO NOTHING
          RETURNING *
        `,
        [
          customer.name,
          customer.mobile,
          customer.email,
          customer.businessName,
          customer.gstNumber,
          customer.customerType,
          customer.address,
          customer.status,
          customer.notes,
          demoUserId,
          demoUserName,
        ],
      )
    }

    const allCustomersResult = await client.query(`SELECT * FROM "customers" ORDER BY "id" ASC`)
    const allCustomers = allCustomersResult.rows

    const insertedProducts = []
    for (const product of products) {
      const result = await client.query(
        `
          INSERT INTO "products"
            ("name", "sku", "category", "unitPrice", "currentStock", "minStockAlert", "location", "createdBy", "createdByName", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), now())
          ON CONFLICT ("sku") DO UPDATE
          SET "name" = EXCLUDED."name",
              "category" = EXCLUDED."category",
              "unitPrice" = EXCLUDED."unitPrice",
              "currentStock" = EXCLUDED."currentStock",
              "minStockAlert" = EXCLUDED."minStockAlert",
              "location" = EXCLUDED."location",
              "createdByName" = EXCLUDED."createdByName",
              "updatedAt" = now()
          RETURNING *
        `,
        [
          product.name,
          product.sku,
          product.category,
          product.unitPrice,
          product.currentStock,
          product.minStockAlert,
          product.location,
          demoUserId,
          demoUserName,
        ],
      )
      insertedProducts.push(result.rows[0])
    }

    const productsBySku = new Map(insertedProducts.map((product) => [product.sku, product]))

    const challanRows = [
      {
        challanNumber: "CH-2026-0001",
        customerName: allCustomers[0]?.name ?? customers[0].name,
        customerId: allCustomers[0]?.id ?? 1,
        customerSnapshot: {
          name: allCustomers[0]?.name ?? customers[0].name,
          mobile: allCustomers[0]?.mobile ?? customers[0].mobile,
          businessName: allCustomers[0]?.businessName ?? customers[0].businessName,
          gstNumber: allCustomers[0]?.gstNumber ?? customers[0].gstNumber,
          address: allCustomers[0]?.address ?? customers[0].address,
        },
        items: [
          { sku: "PAPER-A4-001", quantity: 12 },
          { sku: "PEN-BLUE-010", quantity: 24 },
        ],
        status: "Confirmed",
      },
      {
        challanNumber: "CH-2026-0002",
        customerName: allCustomers[1]?.name ?? customers[1].name,
        customerId: allCustomers[1]?.id ?? 2,
        customerSnapshot: {
          name: allCustomers[1]?.name ?? customers[1].name,
          mobile: allCustomers[1]?.mobile ?? customers[1].mobile,
          businessName: allCustomers[1]?.businessName ?? customers[1].businessName,
          gstNumber: allCustomers[1]?.gstNumber ?? customers[1].gstNumber,
          address: allCustomers[1]?.address ?? customers[1].address,
        },
        items: [
          { sku: "NOTE-EXE-025", quantity: 18 },
          { sku: "DESK-ORG-005", quantity: 4 },
        ],
        status: "Draft",
      },
      {
        challanNumber: "CH-2026-0003",
        customerName: allCustomers[2]?.name ?? customers[2].name,
        customerId: allCustomers[2]?.id ?? 3,
        customerSnapshot: {
          name: allCustomers[2]?.name ?? customers[2].name,
          mobile: allCustomers[2]?.mobile ?? customers[2].mobile,
          businessName: allCustomers[2]?.businessName ?? customers[2].businessName,
          gstNumber: allCustomers[2]?.gstNumber ?? customers[2].gstNumber,
          address: allCustomers[2]?.address ?? customers[2].address,
        },
        items: [
          { sku: "PAPER-A4-001", quantity: 20 },
          { sku: "NOTE-EXE-025", quantity: 10 },
        ],
        status: "Delivered",
      },
    ]

    for (const challan of challanRows) {
      const existing = await client.query(
        `SELECT 1 FROM "challans" WHERE "challanNumber" = $1 LIMIT 1`,
        [challan.challanNumber],
      )

      if (existing.rowCount > 0) continue

      const itemsWithProducts = challan.items.map((item) => {
        const product = productsBySku.get(item.sku)
        if (!product) {
          throw new Error(`Missing product for SKU ${item.sku}`)
        }
        return { product, quantity: item.quantity }
      })

      const totalQuantity = itemsWithProducts.reduce((sum, item) => sum + item.quantity, 0)
      const totalAmount = itemsWithProducts.reduce(
        (sum, item) => sum + Number(item.product.unitPrice) * item.quantity,
        0,
      )

      const challanResult = await client.query(
        `
          INSERT INTO "challans"
            ("challanNumber", "customerId", "customerName", "customerSnapshot", "totalQuantity", "totalAmount", "status", "createdBy", "createdByName", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, now(), now())
          RETURNING *
        `,
        [
          challan.challanNumber,
          challan.customerId,
          challan.customerName,
          JSON.stringify(challan.customerSnapshot),
          totalQuantity,
          totalAmount.toFixed(2),
          challan.status,
          demoUserId,
          demoUserName,
        ],
      )

      const createdChallan = challanResult.rows[0]

      for (const item of itemsWithProducts) {
        await client.query(
          `
            INSERT INTO "challan_items"
              ("challanId", "productId", "productName", "productSku", "unitPrice", "quantity")
            VALUES ($1, $2, $3, $4, $5, $6)
          `,
          [
            createdChallan.id,
            item.product.id,
            item.product.name,
            item.product.sku,
            item.product.unitPrice,
            item.quantity,
          ],
        )
      }

      if (challan.status === "Confirmed" || challan.status === "Delivered") {
        for (const item of itemsWithProducts) {
          await client.query(
            `UPDATE "products" SET "currentStock" = "currentStock" - $1, "updatedAt" = now() WHERE "id" = $2`,
            [item.quantity, item.product.id],
          )
          await client.query(
            `
              INSERT INTO "stock_movements"
                ("productId", "productName", "quantity", "movementType", "reason", "createdBy", "createdByName", "createdAt")
              VALUES ($1, $2, $3, 'OUT', $4, $5, $6, now())
            `,
            [
              item.product.id,
              item.product.name,
              item.quantity,
              `Challan ${challan.challanNumber}`,
              demoUserId,
              demoUserName,
            ],
          )
        }
      }
    }

    for (const product of insertedProducts) {
      const seededStock = await client.query(
        `SELECT 1 FROM "stock_movements" WHERE "productId" = $1 LIMIT 1`,
        [product.id],
      )
      if (seededStock.rowCount === 0 && Number(product.currentStock) > 0) {
        await client.query(
          `
            INSERT INTO "stock_movements"
              ("productId", "productName", "quantity", "movementType", "reason", "createdBy", "createdByName", "createdAt")
            VALUES ($1, $2, $3, 'IN', 'Opening stock', $4, $5, now())
          `,
          [product.id, product.name, Number(product.currentStock), demoUserId, demoUserName],
        )
      }
    }

    await client.query("COMMIT")
    console.log("Demo data seeded successfully")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
