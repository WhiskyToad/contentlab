import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing ${name}`)
  return v
}

let pool: Pool | null = null

export function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: requireEnv('DATABASE_URL'),
      max: 5,
    })
  }
  return pool
}

export function getDb() {
  return drizzle(getPool())
}
