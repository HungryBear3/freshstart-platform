/**
 * Marketing Link Stats API
 * 
 * Get aggregated statistics for marketing attribution
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

/**
 * GET - Get aggregated marketing statistics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get date range from query params
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30')
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get all marketing links
    const links = await prisma.marketingLink.findMany({
      where: { isActive: true },
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

    // Calculate conversion rates
    const signupRate = totals.clicks > 0 
      ? ((totals.signups / totals.clicks) * 100).toFixed(2)
      : '0'
    const conversionRate = totals.signups > 0 
      ? ((totals.conversions / totals.signups) * 100).toFixed(2)
      : '0'

    // Revenue (assuming $299 per conversion)
    const revenue = totals.conversions * 299

    // Group by source
    const bySource = links.reduce((acc, link) => {
      if (!acc[link.utmSource]) {
        acc[link.utmSource] = { clicks: 0, signups: 0, conversions: 0, links: 0 }
      }
      acc[link.utmSource].clicks += link.clicks
      acc[link.utmSource].signups += link.signups
      acc[link.utmSource].conversions += link.conversions
      acc[link.utmSource].links += 1
      return acc
    }, {} as Record<string, { clicks: number; signups: number; conversions: number; links: number }>)

    // Convert to array and add conversion rates
    const sourceStats = Object.entries(bySource).map(([source, stats]) => ({
      source,
      ...stats,
      signupRate: stats.clicks > 0 ? ((stats.signups / stats.clicks) * 100).toFixed(2) : '0',
      conversionRate: stats.signups > 0 ? ((stats.conversions / stats.signups) * 100).toFixed(2) : '0',
      revenue: stats.conversions * 299,
    })).sort((a, b) => b.conversions - a.conversions)

    // Group by campaign
    const byCampaign = links.reduce((acc, link) => {
      if (!acc[link.utmCampaign]) {
        acc[link.utmCampaign] = { clicks: 0, signups: 0, conversions: 0, source: link.utmSource }
      }
      acc[link.utmCampaign].clicks += link.clicks
      acc[link.utmCampaign].signups += link.signups
      acc[link.utmCampaign].conversions += link.conversions
      return acc
    }, {} as Record<string, { clicks: number; signups: number; conversions: number; source: string }>)

    const campaignStats = Object.entries(byCampaign).map(([campaign, stats]) => ({
      campaign,
      ...stats,
      conversionRate: stats.signups > 0 ? ((stats.conversions / stats.signups) * 100).toFixed(2) : '0',
      revenue: stats.conversions * 299,
    })).sort((a, b) => b.conversions - a.conversions)

    // Get user attribution stats from User table
    const userAttributionStats = await prisma.user.groupBy({
      by: ['utmSource'],
      where: {
        utmSource: { not: null },
        createdAt: { gte: startDate },
      },
      _count: { id: true },
    })

    // Top performers (links with highest conversion rates, min 10 clicks)
    const topPerformers = links
      .filter(link => link.clicks >= 10)
      .map(link => ({
        name: link.name,
        shortCode: link.shortCode,
        clicks: link.clicks,
        signups: link.signups,
        conversions: link.conversions,
        conversionRate: link.signups > 0 
          ? ((link.conversions / link.signups) * 100).toFixed(2)
          : '0',
      }))
      .sort((a, b) => parseFloat(b.conversionRate) - parseFloat(a.conversionRate))
      .slice(0, 10)

    return NextResponse.json({
      totals: {
        ...totals,
        signupRate,
        conversionRate,
        revenue,
      },
      bySource: sourceStats,
      byCampaign: campaignStats,
      topPerformers,
      userAttribution: userAttributionStats,
      period: { days, startDate: startDate.toISOString() },
    })
  } catch (error) {
    console.error("Error fetching marketing stats:", error)
    return NextResponse.json(
      { error: "Failed to fetch marketing stats" },
      { status: 500 }
    )
  }
}

/**
 * POST - Increment signup or conversion for a marketing link
 * Called internally when user signs up or converts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { utmSource, utmCampaign, eventType } = body

    if (!utmSource || !utmCampaign || !eventType) {
      return NextResponse.json(
        { error: "Missing required fields: utmSource, utmCampaign, eventType" },
        { status: 400 }
      )
    }

    if (!['signup', 'conversion'].includes(eventType)) {
      return NextResponse.json(
        { error: "eventType must be 'signup' or 'conversion'" },
        { status: 400 }
      )
    }

    // Find matching marketing link
    const link = await prisma.marketingLink.findFirst({
      where: {
        utmSource,
        utmCampaign,
        isActive: true,
      },
    })

    if (!link) {
      // Link not found - this is okay, user may have come from direct UTM params
      return NextResponse.json({ message: "No matching link found" })
    }

    // Increment the appropriate counter
    const updateData = eventType === 'signup' 
      ? { signups: { increment: 1 } }
      : { conversions: { increment: 1 } }

    await prisma.marketingLink.update({
      where: { id: link.id },
      data: updateData,
    })

    return NextResponse.json({ 
      message: `${eventType} recorded for link: ${link.name}`,
      linkId: link.id,
    })
  } catch (error) {
    console.error("Error recording marketing event:", error)
    return NextResponse.json(
      { error: "Failed to record event" },
      { status: 500 }
    )
  }
}
