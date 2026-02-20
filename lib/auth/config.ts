import { type NextAuthConfig } from "next-auth"
import { type JWT } from "next-auth/jwt"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { validateEmail } from "@/lib/security/validation"

export const authOptions: NextAuthConfig = {
  // No adapter needed - we're using JWT sessions, not database sessions
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string" ? credentials.email : ""
        const password =
          typeof credentials?.password === "string" ? credentials.password : ""

        if (!email || !password) {
          throw new Error("Please enter your email and password")
        }

        // Normalize email to lowercase (same as registration)
        const normalizedEmail = validateEmail(email)
        if (!normalizedEmail) {
          throw new Error("Invalid email address")
        }

        // Lazy import Prisma to avoid loading it at module initialization
        const { prisma } = await import("@/lib/db")

        try {
          // Try Prisma query first, fallback to raw SQL if schema mismatch
          let user: { id: string; email: string; password: string | null; name: string | null } | null = null
          
          try {
            // Use select to explicitly specify fields and catch schema mismatches early
            user = await prisma.user.findUnique({
              where: { email: normalizedEmail },
              select: {
                id: true,
                email: true,
                password: true,
                name: true,
              }
            })
          } catch (prismaError: any) {
            // If P2022 error (column doesn't exist), try raw SQL as fallback
            if (prismaError?.code === 'P2022') {
              // Fallback to raw SQL query with only essential columns
              const rawResult = await (prisma as any).$queryRaw<Array<{id: string; email: string; password: string | null; name: string | null}>>`
                SELECT id, email, password, name 
                FROM users 
                WHERE email = ${normalizedEmail}
                LIMIT 1
              `
              user = rawResult[0] || null
            } else {
              throw prismaError
            }
          }

          if (!user || !user.password) {
            throw new Error("No user found with this email")
          }

          const isPasswordValid = await bcrypt.compare(password, user.password)

          if (!isPasswordValid) {
            throw new Error("Invalid password")
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
          }
        } catch (error) {
          // Enhanced error handling for Prisma schema mismatches
          if (error && typeof error === 'object' && 'code' in error) {
            const prismaError = error as { code: string; meta?: any; message?: string }
            if (prismaError.code === 'P2022') {
              // Column doesn't exist - schema mismatch
              const errorMessage = `Database schema mismatch: ${prismaError.message || 'Column does not exist'}. ` +
                `The database schema doesn't match the Prisma schema. ` +
                `Missing columns likely include: utmSource, utmMedium, utmCampaign, utmTerm, utmContent. ` +
                `Please run the migration script: prisma/add_missing_utm_columns.sql in Supabase SQL Editor, ` +
                `then regenerate Prisma client: npm run db:generate`
              console.error("Auth error (schema mismatch):", errorMessage)
              console.error("Prisma error details:", JSON.stringify(prismaError.meta, null, 2))
              // Don't throw here - the raw SQL fallback should have handled it
              // If we're here, the fallback also failed, which means a more serious issue
              throw new Error("Database configuration error. The users table may be missing required columns. Please run the migration script.")
            }
          }
          
          console.error("Auth error:", error)
          throw error
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      const typedToken = token as JWT & { id?: string }
      if (user && typeof user.id === "string") {
        typedToken.id = user.id
        typedToken.sub = user.id
      }
      return typedToken
    },
    async session({ session, token }) {
      if (session.user) {
        const typedToken = token as JWT & { id?: string }
        session.user.id = (typedToken.id ?? typedToken.sub ?? "") as string
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        // Don't set domain - let browser handle it automatically
        // This ensures cookies work for both www and non-www
      },
    },
    callbackUrl: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}authjs.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Host-" : ""}authjs.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        // __Host- prefix requires no domain attribute
      },
    },
  },
}
