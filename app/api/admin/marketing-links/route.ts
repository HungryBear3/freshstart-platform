/**
 * Marketing Links API
 * 
 * CRUD operations for marketing tracking links
 * Used to generate branded short URLs for influencers, videos, and campaigns
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/db"
import { buildTrackingUrl } from "@/lib/analytics/utm-tracking"

export const dynamic = "force-dynamic"

/**
 * GET - List all marketing links with stats
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const source = searchParams.get('source')
    const campaign = searchParams.get('campaign')
    const isActive = searchParams.get('active')

    // Build filter
    const where: any = {}
    if (source) where.utmSource = source
    if (campaign) where.utmCampaign = campaign
    if (isActive !== null) where.isActive = isActive === 'true'

    const links = await prisma.marketingLink.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // Calculate totals
    const totals = links.reduce(
      (acc, link) => ({
        clicks: acc.clicks + link.clicks,
        signups: acc.signups + link.signups,
        conversions: acc.conversions + link.conversions,
      }),
      { clicks: 0, signups: 0, conversions: 0 }
    )

    // Get unique sources and campaigns for filtering
    const sources = [...new Set(links.map(l => l.utmSource))]
    const campaigns = [...new Set(links.map(l => l.utmCampaign))]

    return NextResponse.json({
      links,
      totals,
      filters: { sources, campaigns },
    })
  } catch (error) {
    console.error("Error fetching marketing links:", error)
    return NextResponse.json(
      { error: "Failed to fetch marketing links" },
      { status: 500 }
    )
  }
}

/**
 * POST - Create a new marketing link
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      name, 
      shortCode, 
      utmSource, 
      utmMedium, 
      utmCampaign, 
      utmContent 
    } = body

    // Validate required fields
    if (!name || !shortCode || !utmSource || !utmMedium || !utmCampaign) {
      return NextResponse.json(
        { error: "Missing required fields: name, shortCode, utmSource, utmMedium, utmCampaign" },
        { status: 400 }
      )
    }

    // Validate shortCode format (alphanumeric, hyphens, underscores only)
    if (!/^[a-zA-Z0-9_-]+$/.test(shortCode)) {
      return NextResponse.json(
        { error: "Short code can only contain letters, numbers, hyphens, and underscores" },
        { status: 400 }
      )
    }

    // Check if shortCode already exists
    const existing = await prisma.marketingLink.findUnique({
      where: { shortCode },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Short code already exists" },
        { status: 409 }
      )
    }

    // Build the target URL with UTM parameters
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://freshstart-il.com'
    const targetUrl = buildTrackingUrl(baseUrl, {
      utm_source: utmSource,
      utm_medium: utmMedium,
      utm_campaign: utmCampaign,
      utm_content: utmContent,
    })

    // Create the link
    const link = await prisma.marketingLink.create({
      data: {
        name,
        shortCode,
        targetUrl,
        utmSource,
        utmMedium,
        utmCampaign,
        utmContent,
        createdBy: session.user.id,
      },
    })

    // Generate the short URL
    const shortUrl = `${baseUrl}/go/${shortCode}`

    return NextResponse.json(
      {
        link,
        shortUrl,
        fullUrl: targetUrl,
        message: "Marketing link created successfully",
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating marketing link:", error)
    return NextResponse.json(
      { error: "Failed to create marketing link" },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Update an existing marketing link
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, isActive } = body

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      )
    }

    // Only allow updating name and isActive
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (isActive !== undefined) updateData.isActive = isActive

    const link = await prisma.marketingLink.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ link })
  } catch (error) {
    console.error("Error updating marketing link:", error)
    return NextResponse.json(
      { error: "Failed to update marketing link" },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Delete a marketing link
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Missing required parameter: id" },
        { status: 400 }
      )
    }

    await prisma.marketingLink.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Marketing link deleted successfully" })
  } catch (error) {
    console.error("Error deleting marketing link:", error)
    return NextResponse.json(
      { error: "Failed to delete marketing link" },
      { status: 500 }
    )
  }
}
