/**
 * Test Prisma Client
 * This module provides a Prisma client instance for tests
 * that can be initialized early and shared across test files
 */

import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"

let testPrisma: PrismaClient | null = null
let testPrismaUrl: string | null = null

export function getTestPrisma(): PrismaClient {
  const databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error("TEST_DATABASE_URL or DATABASE_URL must be set")
  }

  if (!testPrisma || testPrismaUrl !== databaseUrl) {
    // Mirror lib/db/prisma.ts: set global TLS flag when DATABASE_INSECURE_TLS=1
    // Required because Prisma's internal engine verifies TLS independently of pg.Pool ssl config
    const isPooler = databaseUrl.includes("pooler.supabase.com") || databaseUrl.includes("pgbouncer=true")
    if (process.env.DATABASE_INSECURE_TLS === "1" && isPooler && !process.env.NODE_TLS_REJECT_UNAUTHORIZED) {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
    }

    const useLocalhost =
      databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1")

    const useSSL = process.env.DATABASE_SSL !== "false" && !useLocalhost

    const pool = new Pool({
      connectionString: databaseUrl,
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
      ssl: useSSL ? { rejectUnauthorized: false } : false,
    })

    const adapter = new PrismaPg(pool)

    testPrisma = new PrismaClient({
      adapter,
    })
    testPrismaUrl = databaseUrl
  }

  return testPrisma
}
