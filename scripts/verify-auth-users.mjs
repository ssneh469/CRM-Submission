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
  if (!connectionString) throw new Error("DATABASE_URL is required")

  const pool = new Pool({ connectionString })
  const client = await pool.connect()

  try {
    const users = await client.query(
      `SELECT "id", "name", "email", "role" FROM "user" WHERE "email" IN ($1, $2, $3) ORDER BY "email" ASC`,
      ["admin@example.com", "sales@example.com", "inventory@example.com"],
    )
    const accounts = await client.query(
      `SELECT "userId", "providerId" FROM "account" WHERE "userId" IN (SELECT "id" FROM "user" WHERE "email" IN ($1, $2, $3)) ORDER BY "userId" ASC`,
      ["admin@example.com", "sales@example.com", "inventory@example.com"],
    )
    console.log(JSON.stringify({ users: users.rows, accounts: accounts.rows }, null, 2))
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
