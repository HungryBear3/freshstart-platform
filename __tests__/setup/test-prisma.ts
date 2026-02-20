/**
 * Test Prisma Client
 * This module provides a Prisma client instance for tests
 * that can be initialized early and shared across test files
 */

import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"

let testPrisma: PrismaClient | null = null

export function getTestPrisma(): PrismaClient {
  if (!testPrisma) {
    const databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL

    if (!databaseUrl) {
      throw new Error("TEST_DATABASE_URL or DATABASE_URL must be set")
    }

    const useLocalhost =
      databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1")

    const useSSL = process.env.DATABASE_SSL !== "false" && !useLocalhost

    // Note: We use rejectUnauthorized: false in the SSL config below for self-signed certs
    // This is connection-specific and doesn't affect other TLS connections

    const pool = new Pool({
      connectionString: databaseUrl,
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
      ssl: useSSL
        ? {
            require: true,
            rejectUnauthorized: false,
          }
        : false,
    })

    const adapter = new PrismaPg(pool)

    testPrisma = new PrismaClient({
      adapter,
    })
  }

  return testPrisma
}

// Initialize immediately if DATABASE_URL is available
if (process.env.DATABASE_URL || process.env.TEST_DATABASE_URL) {
  try {
    getTestPrisma()
  } catch (error) {
    // Will be initialized in beforeAll
  }
}
