/**
 * Integration test setup
 * Configures test database and test environment
 */

import { config } from "dotenv"
import { resolve } from "path"
import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"

// Load environment variables from .env.local
// Try multiple paths to ensure we find the file
const envPaths = [
  resolve(process.cwd(), ".env.local"),
  resolve(__dirname, "../../.env.local"),
  resolve(__dirname, "../../../.env.local"),
]

let loaded = false
for (const envPath of envPaths) {
  try {
    const result = config({ path: envPath, override: true })
    if (result.parsed && Object.keys(result.parsed).length > 0) {
      console.log(`✅ Loaded .env.local from: ${envPath}`)
      console.log(`   Variables loaded: ${Object.keys(result.parsed).join(", ")}`)
      loaded = true
      break
    }
  } catch (error) {
    // Continue to next path
  }
}

// Also try loading from current directory (without override to not overwrite)
if (!loaded) {
  config() // Also load .env if it exists
}

// Verify DATABASE_URL is loaded
if (!process.env.DATABASE_URL) {
  console.error("❌ ERROR: DATABASE_URL not found in environment variables!")
  console.error("   Current working directory:", process.cwd())
  console.error("   Tried paths:", envPaths)
  console.error("   Available env vars:", Object.keys(process.env).filter(k => k.includes("DATABASE")))
} else {
  // Mask password in log
  const masked = process.env.DATABASE_URL.replace(/:[^:@]+@/, ":****@")
  console.log(`✅ DATABASE_URL loaded: ${masked}`)
}

import { getTestPrisma } from "./test-prisma"

let prisma: PrismaClient;

// Integration suites bind ONLY to a dedicated TEST_DATABASE_URL. There is NO
// fallback to process.env.DATABASE_URL (production) — a fallback would let these
// suites connect to, and (via the beforeEach cleanup below) DELETE FROM,
// production. When TEST_DATABASE_URL is absent the suites are SKIPPED with a
// clear reason via `describeIntegration`, and every DB hook below is inert, so
// no production access is ever possible from the test process.
export const HAS_TEST_DATABASE = Boolean(process.env.TEST_DATABASE_URL)

/** `describe` when a dedicated test database is configured, else a skipped
 *  block. Integration suites use this so a missing TEST_DATABASE_URL yields
 *  explicit, labelled skips rather than failures — and never a production hit. */
export const describeIntegration: jest.Describe = HAS_TEST_DATABASE ? describe : describe.skip

if (!HAS_TEST_DATABASE) {
  console.log(
    "ℹ️  TEST_DATABASE_URL not set — integration suites are SKIPPED " +
      "(no fallback to production DATABASE_URL).",
  )
}

beforeAll(async () => {
  if (!HAS_TEST_DATABASE) return // suites skipped; never touch a database

  // Pin Prisma to the TEST database only (never the ambient production URL).
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL

  prisma = getTestPrisma()
  await prisma.$connect()
  try {
    await prisma.$queryRaw`SELECT 1`
    console.log("✅ Test database connection verified")
  } catch (error) {
    console.error("❌ Test database connection failed:", error)
    throw error
  }
})

afterAll(async () => {
  if (HAS_TEST_DATABASE && prisma) {
    await prisma.$disconnect()
  }
})

beforeEach(async () => {
  // Clean up test data before each test — ONLY against a dedicated test database.
  if (HAS_TEST_DATABASE && prisma) {
    await prisma.user.deleteMany({
      where: {
        email: {
          contains: "test@",
        },
      },
    })
  }
})

export { prisma }
