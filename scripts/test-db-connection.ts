/**
 * Test database connection script
 * Run with: npx tsx scripts/test-db-connection.ts
 */

import { config } from "dotenv"
import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { resolve } from "path"

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") })
config() // Also load .env if it exists

async function testConnection() {
  console.log("🔍 Testing database connection...\n")

  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error("❌ ERROR: DATABASE_URL environment variable is not set!")
    console.log("\n📝 Please create a .env.local file with:")
    console.log('   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"')
    process.exit(1)
  }

  // Mask password in output
  const maskedUrl = databaseUrl.replace(/:[^:@]+@/, ":****@")
  console.log(`📡 Connection string: ${maskedUrl}\n`)

  try {
    // Test basic PostgreSQL connection
    console.log("1️⃣ Testing PostgreSQL connection...")
    const useLocalhost =
      databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1")

    const useSSL = process.env.DATABASE_SSL !== "false" && !useLocalhost

    // Note: We use rejectUnauthorized: false in the SSL config below for self-signed certs
    // This is connection-specific and doesn't affect other TLS connections

    const pool = new Pool({
      connectionString: databaseUrl,
      max: 1,
      connectionTimeoutMillis: 5000,
      ssl: useSSL
        ? {
            rejectUnauthorized: false,
          }
        : false,
    })

    const client = await pool.connect()
    console.log("   ✅ PostgreSQL connection successful!")
    
    // Test query
    const result = await client.query("SELECT version(), current_database(), current_user")
    console.log(`   📊 Database: ${result.rows[0].current_database}`)
    console.log(`   👤 User: ${result.rows[0].current_user}`)
    console.log(`   🗄️  Version: ${result.rows[0].version.split(" ")[0]} ${result.rows[0].version.split(" ")[1]}`)
    
    client.release()
    await pool.end()

    // Test Prisma connection
    console.log("\n2️⃣ Testing Prisma Client connection...")
    const adapter = new PrismaPg(
      new Pool({
        connectionString: databaseUrl,
        max: 1,
        connectionTimeoutMillis: 5000,
        ssl: useSSL
          ? {
              rejectUnauthorized: false,
            }
          : false,
      })
    )

    const prisma = new PrismaClient({
      adapter,
    })

    await prisma.$connect()
    console.log("   ✅ Prisma Client connection successful!")

    // Test query
    console.log("\n3️⃣ Testing database query...")
    const userCount = await prisma.user.count()
    console.log(`   ✅ Query successful! Found ${userCount} user(s) in database.`)

    // Check if tables exist
    console.log("\n4️⃣ Checking database tables...")
    const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `
    
    if (tables.length > 0) {
      console.log(`   ✅ Found ${tables.length} table(s):`)
      tables.forEach((table) => {
        console.log(`      - ${table.tablename}`)
      })
    } else {
      console.log("   ⚠️  No tables found. You may need to run migrations:")
      console.log("      npm run db:migrate")
    }

    await prisma.$disconnect()
    console.log("\n✅ All connection tests passed! Database is ready to use.")
    process.exit(0)
  } catch (error: any) {
    console.error("\n❌ Connection failed!")
    console.error(`\nError: ${error.message}\n`)

    if (error.code === "ENOTFOUND") {
      console.log("💡 This usually means:")
      console.log("   - The database hostname is incorrect")
      console.log("   - There's a network connectivity issue")
    } else if (error.code === "ECONNREFUSED") {
      console.log("💡 This usually means:")
      console.log("   - The database server is not running")
      console.log("   - The port number is incorrect")
      console.log("   - A firewall is blocking the connection")
    } else if (error.message.includes("password")) {
      console.log("💡 This usually means:")
      console.log("   - The database password is incorrect")
      console.log("   - Make sure you replaced [YOUR-PASSWORD] in the connection string")
    } else if (error.message.includes("SSL") || error.message.includes("TLS")) {
      console.log("💡 This usually means:")
      console.log("   - SSL/TLS configuration issue")
      console.log("   - Try adding ?sslmode=require to your connection string")
    } else {
      console.log("💡 Troubleshooting steps:")
      console.log("   1. Verify DATABASE_URL in .env.local is correct")
      console.log("   2. Check Supabase dashboard - is project active?")
      console.log("   3. Try using the connection pooler (port 6543)")
      console.log("   4. Wait 2-5 minutes if you just created the Supabase project")
    }

    process.exit(1)
  }
}

testConnection()
