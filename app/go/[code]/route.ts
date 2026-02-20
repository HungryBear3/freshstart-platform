/**
 * Short URL Redirect Handler
 * 
 * Handles branded short URLs for marketing links
 * e.g., freshstart-il.com/go/jane -> redirects with UTM params
 * 
 * Increments click count on each redirect
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    if (!code) {
      // Redirect to home if no code provided
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Look up the marketing link
    const link = await prisma.marketingLink.findUnique({
      where: { shortCode: code },
    })

    if (!link) {
      // Link not found - redirect to home
      console.log(`[Marketing Link] Unknown code: ${code}`)
      return NextResponse.redirect(new URL('/', request.url))
    }

    if (!link.isActive) {
      // Link is deactivated - redirect to home
      console.log(`[Marketing Link] Inactive link: ${code}`)
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Increment click count (fire and forget - don't wait)
    prisma.marketingLink.update({
      where: { id: link.id },
      data: { clicks: { increment: 1 } },
    }).catch(err => {
      console.error('[Marketing Link] Failed to increment clicks:', err)
    })

    console.log(`[Marketing Link] Redirect: ${code} -> ${link.targetUrl}`)

    // Redirect to the target URL (which includes UTM params)
    return NextResponse.redirect(link.targetUrl)
  } catch (error) {
    console.error('[Marketing Link] Error:', error)
    // On error, redirect to home
    return NextResponse.redirect(new URL('/', request.url))
  }
}
