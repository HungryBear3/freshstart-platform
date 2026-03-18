#!/usr/bin/env tsx
/**
 * Quick script to check if required environment variables are set
 */

import { config } from "dotenv"
import { resolve } from "path"

// Load .env.local file
config({ path: resolve(process.cwd(), ".env.local") })

const requiredVars = [
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "DATABASE_URL",
] as const

const optionalVars = [
  "ALLOWED_ORIGIN",
  "SENTRY_DSN",
  "DIRECT_DATABASE_URL", // Required for migrations with Supabase pooler; use direct connection (port 5432)
] as const

console.log("🔍 Checking environment variables...\n")

let allGood = true

// Check required variables
console.log("Required variables:")
for (const varName of requiredVars) {
  const value = process.env[varName]
  if (!value) {
    console.log(`  ❌ ${varName} - MISSING`)
    allGood = false
  } else {
    // Mask secret values
    if (varName.includes("SECRET") || varName.includes("PASSWORD")) {
      console.log(`  ✅ ${varName} - Set (${value.length} chars)`)
    } else {
      console.log(`  ✅ ${varName} - ${value}`)
    }
  }
}

// Check optional variables
console.log("\nOptional variables:")
for (const varName of optionalVars) {
  const value = process.env[varName]
  if (!value) {
    console.log(`  ⚠️  ${varName} - Not set (optional)`)
  } else {
    console.log(`  ✅ ${varName} - Set`)
  }
}

if (!allGood) {
  console.log("\n❌ Some required environment variables are missing!")
  console.log("\nTo fix:")
  console.log("1. Check your .env.local file exists")
  console.log("2. Make sure it contains:")
  console.log("   NEXTAUTH_URL=http://localhost:3000")
  console.log("   NEXTAUTH_SECRET=<your-secret>")
  console.log("   DATABASE_URL=<your-database-url>")
  console.log("\n3. Generate NEXTAUTH_SECRET if needed:")
  console.log("   openssl rand -base64 32")
  process.exit(1)
} else {
  console.log("\n✅ All required environment variables are set!")
}
