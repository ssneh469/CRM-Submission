import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { Pool } from "pg"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, "..")
const sqlFile = path.join(rootDir, "db", "init.sql")
const envFile = path.join(rootDir, ".env.local")

const dryRun = process.argv.includes("--dry-run")

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
  const sql = await fs.readFile(sqlFile, "utf8")

  if (dryRun) {
    console.log(`Loaded schema SQL from ${sqlFile}`)
    console.log(`Statements: ${sql.split(";").filter((statement) => statement.trim()).length}`)
    return
  }

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL is required")
  }

  const pool = new Pool({ connectionString })
  try {
    await pool.query(sql)
    console.log("Database schema initialized successfully")
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
