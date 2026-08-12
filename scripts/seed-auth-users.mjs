import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { Pool } from "pg"
import { betterAuth } from "better-auth"

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

function createAuth(pool) {
  return betterAuth({
    database: pool,
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    secret: process.env.BETTER_AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },
    user: {
      additionalFields: {
        role: {
          type: "string",
          required: false,
          defaultValue: "Sales",
          input: true,
        },
      },
    },
  })
}

async function main() {
  await loadEnvFile(envFile)

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error("DATABASE_URL is required")

  const pool = new Pool({ connectionString })
  const client = await pool.connect()
  const auth = createAuth(pool)
  const authHeaders = new Headers({
    origin: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    host: "localhost:3000",
  })

  const accounts = [
    {
      name: "Demo Admin",
      email: "admin@example.com",
      password: "Admin@12345",
      role: "Admin",
    },
    {
      name: "Demo Sales",
      email: "sales@example.com",
      password: "Sales@12345",
      role: "Sales",
    },
    {
      name: "Demo Inventory",
      email: "inventory@example.com",
      password: "Inventory@12345",
      role: "Inventory Manager",
    },
  ]

  const results = []

  try {
    for (const account of accounts) {
      const [existingUser] = await client.query(
        `SELECT "id", "role" FROM "user" WHERE "email" = $1 LIMIT 1`,
        [account.email],
      ).then((result) => result.rows)

      const [existingCredential] = existingUser
        ? await client.query(
            `SELECT 1 FROM "account" WHERE "userId" = $1 AND "providerId" = 'credential' LIMIT 1`,
            [existingUser.id],
          ).then((result) => result.rows)
        : [null]

      if (existingUser && existingCredential) {
        await client.query(
          `UPDATE "user" SET "name" = $1, "role" = $2, "updatedAt" = now() WHERE "id" = $3`,
          [account.name, account.role, existingUser.id],
        )
        results.push({ ...account, id: existingUser.id, created: false })
        continue
      }

      if (existingUser) {
        await client.query(`DELETE FROM "session" WHERE "userId" = $1`, [existingUser.id])
        await client.query(`DELETE FROM "account" WHERE "userId" = $1`, [existingUser.id])
        await client.query(`DELETE FROM "user" WHERE "id" = $1`, [existingUser.id])
      }

      const response = await auth.api.signUpEmail({
        body: {
          name: account.name,
          email: account.email,
          password: account.password,
          role: account.role,
        },
        headers: authHeaders,
      })

      results.push({
        ...account,
        id: response.user.id,
        created: true,
        previousId: existingUser?.id ?? null,
      })
    }

    const adminResult = results.find((result) => result.role === "Admin")
    if (adminResult?.previousId && adminResult.previousId !== adminResult.id) {
      const updateTables = [
        "customers",
        "customer_notes",
        "products",
        "stock_movements",
        "challans",
      ]

      for (const table of updateTables) {
        await client.query(
          `UPDATE "${table}" SET "createdBy" = $1, "createdByName" = $2 WHERE "createdBy" = $3 OR "createdByName" = $2`,
          [adminResult.id, "Demo Admin", adminResult.previousId],
        )
      }
    }

    console.log(
      JSON.stringify(
        results.map(({ name, email, password, role, id, created }) => ({
          name,
          email,
          password,
          role,
          id,
          created,
        })),
        null,
        2,
      ),
    )
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
