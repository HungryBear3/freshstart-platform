import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

// Export runtime config for Vercel
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Check if database connection is available
function isDatabaseAvailable(): boolean {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.warn("[API] DATABASE_URL not set in environment variables")
    return false
  }
  
  // Log connection string info (without password) for debugging
  const urlInfo = dbUrl.replace(/:[^:@]+@/, ':****@')
  console.log("[API] DATABASE_URL format:", {
    hasPooler: urlInfo.includes('pooler.supabase.com'),
    hasPort: urlInfo.includes(':6543'),
    hasPgbouncer: urlInfo.includes('pgbouncer=true'),
    hostname: urlInfo.match(/@([^:]+)/)?.[1] || 'unknown',
  })
  
  return true
}

/**
 * Track and retrieve visitor count
 * GET: Returns total visitor count
 * POST: Increments visitor count (only once per session)
 */

// Fallback function using raw SQL if Prisma model isn't available
async function getVisitorCountRaw() {
  try {
    // Use Prisma's $queryRawUnsafe - it uses the existing connection
    const result = await (prisma as any).$queryRawUnsafe(`
      SELECT 
        COALESCE(SUM(count), 0)::bigint as total,
        COALESCE(MAX(CASE WHEN date = CURRENT_DATE THEN count ELSE 0 END), 0)::bigint as today
      FROM visitor_counts
    `) as Array<{ total: bigint | number; today: bigint | number }>
    
    const total = result[0]?.total ? Number(result[0].total) : 0
    const today = result[0]?.today ? Number(result[0].today) : 0
    
    console.log("[API] Raw SQL query result:", { total, today })
    
    return {
      total,
      today,
    }
  } catch (error: any) {
    console.error("[API] Raw SQL query failed:", error)
    console.error("[API] Error details:", {
      message: error?.message,
      code: error?.code,
    })
    
    // If connection error, return zeros
    if (
      error?.code === 'ENOTFOUND' ||
      error?.code === 'P2010' ||
      error?.code === 'P1001' ||
      error?.message?.includes('ENOTFOUND') ||
      error?.message?.includes('getaddrinfo') ||
      error?.message?.includes("Can't reach database server") ||
      error?.meta?.driverAdapterError?.cause?.kind === 'DatabaseNotReachable'
    ) {
      console.error("[API] Database connection failed in raw SQL:", {
        code: error?.code,
        message: error?.message,
      })
      return { total: 0, today: 0 }
    }
    
    // If table doesn't exist, return zeros
    if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
      return { total: 0, today: 0 }
    }
    throw error
  }
}

export async function GET() {
  // Check if database is configured
  if (!isDatabaseAvailable()) {
    console.warn("[API] Database not available, returning zero counts")
    return NextResponse.json({
      total: 0,
      today: 0,
    })
  }

  try {
    // Get today's date (UTC, date only)
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    try {
      // Try using Prisma model first
      const todayCount = await prisma.visitorCount.findUnique({
        where: { date: today },
      })

      const allCounts = await prisma.visitorCount.findMany({
        select: { count: true },
      })

      const totalCount = allCounts.reduce((sum, record) => sum + record.count, 0)
      const todayVisitors = todayCount?.count || 0

      return NextResponse.json({
        total: totalCount,
        today: todayVisitors,
      })
    } catch (prismaError: any) {
      // Check if it's a connection error
      if (
        prismaError?.code === 'ENOTFOUND' ||
        prismaError?.code === 'P2010' ||
        prismaError?.code === 'P1001' ||
        prismaError?.message?.includes('ENOTFOUND') ||
        prismaError?.message?.includes('getaddrinfo') ||
        prismaError?.message?.includes("Can't reach database server") ||
        prismaError?.meta?.driverAdapterError?.cause?.kind === 'DatabaseNotReachable'
      ) {
        console.error("[API] Database connection failed:", {
          code: prismaError?.code,
          message: prismaError?.message,
          host: prismaError?.meta?.driverAdapterError?.cause?.host,
          port: prismaError?.meta?.driverAdapterError?.cause?.port,
        })
        return NextResponse.json({
          total: 0,
          today: 0,
        })
      }

      // If Prisma model doesn't exist, fall back to raw SQL
      if (
        prismaError?.message?.includes('visitorCount') ||
        prismaError?.code === 'P2001' ||
        prismaError?.code === 'P2025'
      ) {
        console.warn("Prisma model not available, using raw SQL fallback")
        const counts = await getVisitorCountRaw()
        return NextResponse.json(counts)
      }
      throw prismaError
    }
  } catch (error: any) {
    console.error("Error fetching visitor count:", error)
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    })
    
    // Check if it's a connection error
    if (
      error?.code === 'ENOTFOUND' ||
      error?.code === 'P2010' ||
      error?.code === 'P1001' ||
      error?.message?.includes('ENOTFOUND') ||
      error?.message?.includes('getaddrinfo') ||
      error?.message?.includes("Can't reach database server") ||
      error?.meta?.driverAdapterError?.cause?.kind === 'DatabaseNotReachable'
    ) {
      console.error("[API] Database connection failed, returning zero counts:", {
        code: error?.code,
        message: error?.message,
        host: error?.meta?.driverAdapterError?.cause?.host,
        port: error?.meta?.driverAdapterError?.cause?.port,
      })
      return NextResponse.json({
        total: 0,
        today: 0,
      })
    }
    
    // Try raw SQL as last resort
    try {
      const counts = await getVisitorCountRaw()
      return NextResponse.json(counts)
    } catch (fallbackError: any) {
      // If everything fails, return zeros (graceful degradation)
      console.error("[API] All methods failed, returning zero counts")
      return NextResponse.json({
        total: 0,
        today: 0,
      })
    }
  }
}

// Fallback function using raw SQL for POST
async function incrementVisitorCountRaw() {
  try {
    // First, try to ensure the unique constraint exists
    try {
      await (prisma as any).$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS visitor_counts_date_key ON visitor_counts(date)
      `)
    } catch (constraintError: any) {
      // Ignore if constraint already exists or if we can't create it
      console.log("[API] Unique constraint check:", constraintError?.message || "OK")
    }
    
    // Generate a simple unique ID and escape it
    const newId = `visitor_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    // Escape single quotes for SQL
    const escapedId = newId.replace(/'/g, "''")
    
    console.log("[API] Attempting to increment visitor count with ID:", newId)
    
    // Try ON CONFLICT first (if unique constraint exists)
    try {
      await (prisma as any).$executeRawUnsafe(`
        INSERT INTO visitor_counts (id, date, count, "createdAt", "updatedAt")
        VALUES ('${escapedId}', CURRENT_DATE, 1, NOW(), NOW())
        ON CONFLICT (date) 
        DO UPDATE SET 
          count = visitor_counts.count + 1,
          "updatedAt" = NOW()
      `)
      console.log("[API] Insert with ON CONFLICT completed successfully")
    } catch (onConflictError: any) {
      // If ON CONFLICT fails (no unique constraint), use manual check
      if (
        onConflictError?.code === '42P10' ||
        onConflictError?.message?.includes('no unique or exclusion constraint')
      ) {
        console.log("[API] ON CONFLICT not available, using manual upsert")
        
        // Check if record exists for today
        const existing = await (prisma as any).$queryRawUnsafe(`
          SELECT id, count FROM visitor_counts WHERE date = CURRENT_DATE LIMIT 1
        `) as Array<{ id: string; count: number }>
        
        if (existing && existing.length > 0) {
          // Update existing record
          await (prisma as any).$executeRawUnsafe(`
            UPDATE visitor_counts 
            SET count = count + 1, "updatedAt" = NOW()
            WHERE date = CURRENT_DATE
          `)
          console.log("[API] Updated existing record")
        } else {
          // Insert new record
          await (prisma as any).$executeRawUnsafe(`
            INSERT INTO visitor_counts (id, date, count, "createdAt", "updatedAt")
            VALUES ('${escapedId}', CURRENT_DATE, 1, NOW(), NOW())
          `)
          console.log("[API] Inserted new record")
        }
      } else {
        throw onConflictError
      }
    }
    
    // Get totals using the same method as GET
    const totals = await getVisitorCountRaw()
    
    console.log("[API] After increment, totals:", totals)
    
    return {
      success: true,
      total: totals.total,
      today: totals.today,
    }
  } catch (error: any) {
    console.error("[API] Raw SQL increment failed:", error)
    console.error("[API] Error details:", {
      message: error?.message,
      code: error?.code,
    })
    
    // If connection error, return zeros
    if (
      error?.code === 'ENOTFOUND' ||
      error?.code === 'P2010' ||
      error?.code === 'P1001' ||
      error?.message?.includes('ENOTFOUND') ||
      error?.message?.includes('getaddrinfo') ||
      error?.message?.includes("Can't reach database server") ||
      error?.meta?.driverAdapterError?.cause?.kind === 'DatabaseNotReachable'
    ) {
      console.error("[API] Database connection failed in raw SQL increment:", {
        code: error?.code,
        message: error?.message,
      })
      return { success: true, total: 0, today: 0 }
    }
    
    // If table doesn't exist, return zeros
    if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
      return { success: true, total: 0, today: 0 }
    }
    throw error
  }
}

export async function POST(request: NextRequest) {
  // Check if database is configured
  if (!isDatabaseAvailable()) {
    console.warn("[API] Database not available, returning zero counts")
    return NextResponse.json({
      success: true,
      total: 0,
      today: 0,
    }, { status: 200 })
  }

  try {
    // Get today's date (UTC, date only)
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    try {
      // Try using Prisma model first
      const visitorCount = await prisma.visitorCount.upsert({
        where: { date: today },
        update: {
          count: {
            increment: 1,
          },
        },
        create: {
          date: today,
          count: 1,
        },
      })

      const allCounts = await prisma.visitorCount.findMany({
        select: { count: true },
      })

      const totalCount = allCounts.reduce((sum, record) => sum + record.count, 0)

      return NextResponse.json({
        success: true,
        total: totalCount,
        today: visitorCount.count,
      })
    } catch (prismaError: any) {
      // Check if it's a connection error
      if (
        prismaError?.code === 'ENOTFOUND' ||
        prismaError?.code === 'P2010' ||
        prismaError?.code === 'P1001' ||
        prismaError?.message?.includes('ENOTFOUND') ||
        prismaError?.message?.includes('getaddrinfo') ||
        prismaError?.message?.includes("Can't reach database server") ||
        prismaError?.meta?.driverAdapterError?.cause?.kind === 'DatabaseNotReachable'
      ) {
        console.error("[API] Database connection failed:", {
          code: prismaError?.code,
          message: prismaError?.message,
          host: prismaError?.meta?.driverAdapterError?.cause?.host,
          port: prismaError?.meta?.driverAdapterError?.cause?.port,
        })
        return NextResponse.json({
          success: true,
          total: 0,
          today: 0,
        }, { status: 200 })
      }

      // If Prisma model doesn't exist, fall back to raw SQL
      if (
        prismaError?.message?.includes('visitorCount') ||
        prismaError?.code === 'P2001'
      ) {
        console.warn("Prisma model not available, using raw SQL fallback")
        const result = await incrementVisitorCountRaw()
        return NextResponse.json(result)
      }
      throw prismaError
    }
  } catch (error: any) {
    console.error("Error tracking visitor:", error)
    console.error("Error details:", {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    })
    
    // Check if it's a connection error
    if (
      error?.code === 'ENOTFOUND' ||
      error?.code === 'P2010' ||
      error?.code === 'P1001' ||
      error?.message?.includes('ENOTFOUND') ||
      error?.message?.includes('getaddrinfo') ||
      error?.message?.includes("Can't reach database server") ||
      error?.meta?.driverAdapterError?.cause?.kind === 'DatabaseNotReachable'
    ) {
      console.error("[API] Database connection failed, returning zero counts:", {
        code: error?.code,
        message: error?.message,
        host: error?.meta?.driverAdapterError?.cause?.host,
        port: error?.meta?.driverAdapterError?.cause?.port,
      })
      return NextResponse.json({
        success: true,
        total: 0,
        today: 0,
      }, { status: 200 })
    }
    
    // Try raw SQL as last resort
    try {
      const result = await incrementVisitorCountRaw()
      return NextResponse.json(result)
    } catch (fallbackError: any) {
      console.error("All fallback methods failed:", fallbackError)
      console.error("Final fallback error:", {
        message: fallbackError?.message,
        code: fallbackError?.code,
        name: fallbackError?.name,
      })
      // If everything fails, return success with zeros (graceful degradation)
      // This prevents the page from breaking - visitor counter will show 0
      return NextResponse.json({
        success: true,
        total: 0,
        today: 0,
      }, { status: 200 }) // Always return 200 to prevent page errors
    }
  }
}
