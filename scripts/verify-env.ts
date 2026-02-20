/**
 * Verify environment variables are loaded correctly
 */

import { config } from "dotenv"
import { resolve } from "path"

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") })
config()

const dbUrl = process.env.DATABASE_URL

if (!dbUrl) {
  console.error("❌ DATABASE_URL not found in environment")
  process.exit(1)
}

// Parse connection string
try {
  const url = new URL(dbUrl)
  console.log("✅ DATABASE_URL found")
  console.log(`   Protocol: ${url.protocol}`)
  console.log(`   Host: ${url.hostname}`)
  console.log(`   Port: ${url.port || "5432 (default)"}`)
  console.log(`   Database: ${url.pathname.slice(1)}`)
  console.log(`   User: ${url.username}`)
  console.log(`   Password: ${url.password ? "***" + url.password.slice(-2) : "not set"}`)
  
  if (url.searchParams.has("sslmode")) {
    console.log(`   SSL Mode: ${url.searchParams.get("sslmode")}`)
  }
} catch (e) {
  console.error("❌ Invalid DATABASE_URL format")
  console.error(e)
  process.exit(1)
}
