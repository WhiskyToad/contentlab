import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/lib/server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    // Use Supabase (or any Postgres) connection string
    // e.g. postgres://postgres:<password>@db.<ref>.supabase.co:5432/postgres
    url: process.env.DATABASE_URL!,
  },
})
