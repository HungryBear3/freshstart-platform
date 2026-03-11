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

beforeAll(async () => {
  // Use test database URL if available, otherwise use main database
  const databaseUrl =
    process.env.TEST_DATABASE_URL || process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error("TEST_DATABASE_URL or DATABASE_URL must be set")
  }

  // Set DATABASE_URL environment variable for Prisma
  process.env.DATABASE_URL = databaseUrl

  // Get or create test prisma instance
  prisma = getTestPrisma()

  // Connect to database
  await prisma.$connect()
  
  // Verify connection works
  try {
    await prisma.$queryRaw`SELECT 1`
    console.log("✅ Database connection verified")
  } catch (error) {
    console.error("❌ Database connection failed:", error)
    throw error
  }
})

afterAll(async () => {
  // Disconnect from database
  await prisma.$disconnect()
})

beforeEach(async () => {
  // Clean up test data before each test
  // Be careful - this will delete all data in test database!
  if (process.env.TEST_DATABASE_URL) {
    // Only clean if using dedicated test database
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
