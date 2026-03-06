/**
 * Verifies the role column exists and works on the users table.
 * Run: npx tsx scripts/verify-role.ts
 */
import { config } from "dotenv"
import { resolve } from "path"

// Load .env.local BEFORE prisma (imports are hoisted, so we dynamic-import prisma after)
config({ path: resolve(process.cwd(), ".env.local") })
config()

async function main() {
  const { prisma } = await import("@/lib/db/prisma")
  const dbUrl = process.env.DATABASE_URL || ""
  if (!dbUrl) {
    console.error("ERROR: DATABASE_URL not set. Ensure .env.local exists with DATABASE_URL.")
    process.exit(1)
  }
  const masked = dbUrl.replace(/:[^:@]+@/, ":****@").replace(/@[^/]+/, "@***")
  console.log("DB (masked):", masked)
  console.log("")

  try {
    // 1. Query information_schema to see what columns exist on users table
    const cols = await prisma.$queryRaw<
      Array<{ column_name: string; data_type: string }>
    >`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'users'
      ORDER BY ordinal_position
    `
    const hasRole = cols.some((c) => c.column_name === "role")
    console.log("Columns on public.users:", cols.map((c) => c.column_name).join(", ") || "(none)")
    console.log("Has 'role' column:", hasRole)
    console.log("")

    if (!hasRole) {
      console.error("Migration NOT applied: role column does not exist in the DB Prisma connects to.")
      console.error("Check: Is DATABASE_URL in .env.local the same Supabase project as the SQL Editor?")
      console.error("Fix: Run in Supabase SQL Editor (same project as DATABASE_URL):")
      console.error('  ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT \'user\';')
      return
    }

    // 2. Try Prisma query
    const user = await prisma.user.findFirst({
      select: { email: true, role: true },
    })
    if (user) {
      console.log("[OK] Migration verified: role column exists")
      console.log("     Sample:", user.email, "has role=", user.role)
    } else {
      console.log("[OK] Migration verified: role column exists (no users in DB)")
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes("column") && msg.includes("role")) {
      console.error("Migration NOT applied: Prisma query failed - role column missing")
      console.error("Run: npx prisma migrate deploy")
    } else if (msg.includes("TLS") || msg.includes("SSL")) {
      console.error("Connection error: TLS/SSL mismatch.")
      console.error("For Supabase pooler (port 6543), add to .env.local:")
      console.error("  DATABASE_INSECURE_TLS=1")
      console.error("For local Postgres, add: DATABASE_SSL=false")
    } else {
      throw err
    }
  } finally {
    await prisma.$disconnect()
  }
}

main()
