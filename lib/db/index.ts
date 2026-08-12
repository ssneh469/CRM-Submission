// import { drizzle } from "drizzle-orm/node-postgres"
// import { Pool } from "pg"
// import * as schema from "./schema"

// export const pool = new Pool({ connectionString: process.env.DATABASE_URL })
// export const db = drizzle(pool, { schema })


import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

const globalForDb = globalThis as unknown as {
  pool: Pool | undefined
}

// Re-use connection pool across serverless function invocations
export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1, // Restrict each serverless instance to a single connection
    idleTimeoutMillis: 10000, // Close idle connections quickly
    connectionTimeoutMillis: 5000, // Timeout fast if database is unreachable
  })

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool
}

export const db = drizzle(pool, { schema })
