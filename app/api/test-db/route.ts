import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  try {
    // Use shared Prisma client (with pg adapter)
    const { prisma } = await import("@/lib/db")
    
    // Test connection
    await prisma.$connect()
    
    // Test query
    const userCount = await prisma.user.count()
    
    // Clean up
    await prisma.$disconnect()
    
    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      userCount
    })
  } catch (error: any) {
    console.error("Database test error:", error)
    return NextResponse.json({
      success: false,
      error: error?.message || String(error),
      code: error?.code,
      stack: process.env.NODE_ENV === "development" ? error?.stack : undefined
    }, { status: 500 })
  }
}
