import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"
import { applySecurityHeaders } from "@/lib/security/middleware"

export async function middleware(request: NextRequest) {
  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    try {
      // Log cookie header for debugging
      const cookieHeader = request.headers.get("cookie")
      console.log("[Middleware] Cookie header:", cookieHeader ? "present" : "missing")
      
      // Extract cookie name from environment
      const isProduction = process.env.NODE_ENV === "production"
      const sessionCookieName = isProduction 
        ? "__Secure-authjs.session-token" 
        : "authjs.session-token"
      
      // Check if the session cookie exists in the request
      const hasSessionCookie = cookieHeader?.includes(sessionCookieName)
      console.log("[Middleware] Session cookie name:", sessionCookieName)
      console.log("[Middleware] Session cookie present:", hasSessionCookie ? "yes" : "no")
      
      // Get token from request - explicitly specify cookie name for NextAuth v5
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        cookieName: sessionCookieName,
      })

      console.log("[Middleware] Token found:", token ? "yes" : "no")
      if (token) {
        console.log("[Middleware] Token user ID:", token.sub || token.id)
      }

      // If no token, redirect to signin (but check referer to prevent loops)
      if (!token) {
        const referer = request.headers.get("referer")
        const isFromSignin = referer?.includes("/auth/signin")
        
        console.log("[Middleware] No token, referer:", referer, "isFromSignin:", isFromSignin)
        
        // Don't redirect if we just came from signin (prevents infinite loop)
        if (!isFromSignin) {
          const signInUrl = new URL("/auth/signin", request.url)
          signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname)
          const response = NextResponse.redirect(signInUrl)
          return applySecurityHeaders(response)
        } else {
          // If coming from signin but no token, allow through to let page handle it
          // This prevents infinite loops
          console.log("[Middleware] Allowing through despite no token (from signin)")
        }
      }
    } catch (error) {
      // If token reading fails, log and allow through (let page handle it)
      console.error("[Middleware] Error reading token:", error)
    }
  }

  const response = NextResponse.next()
  return applySecurityHeaders(response)
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
