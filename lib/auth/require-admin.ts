import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"
import { prisma } from "@/lib/db"

/**
 * Require admin role for API routes.
 * Returns 401 if not authenticated, 403 if not admin.
 * Returns the user object if admin.
 */
export async function requireAdmin(request: NextRequest): Promise<
  | { user: { id: string; email: string; role: string }; error: null }
  | { user: null; error: NextResponse }
> {
  const isProduction = process.env.NODE_ENV === "production"
  const sessionCookieName = isProduction
    ? "__Secure-authjs.session-token"
    : "authjs.session-token"

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: sessionCookieName,
  })

  if (!token) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  if (!token.sub && !(token as { id?: string }).id) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }

  const userId = ((token as { id?: string }).id ?? token.sub) as string

  // Always verify the current database role. A signed JWT can outlive an
  // administrator's privileges and must not authorize privileged mutations
  // after demotion or account removal.
  let dbUser
  try {
    dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    })
  } catch {
    return {
      user: null,
      error: NextResponse.json({ error: "Unable to verify administrator" }, { status: 503 }),
    }
  }

  if (!dbUser || dbUser.role !== "admin") {
    return {
      user: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    }
  }

  return {
    user: { id: dbUser.id, email: dbUser.email, role: dbUser.role ?? "user" },
    error: null,
  }
}
