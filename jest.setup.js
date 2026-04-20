// Load environment variables FIRST, before any other modules
// This ensures DATABASE_URL is available when @/lib/db is imported
const path = require("path")
const { config } = require("dotenv")

// Try multiple paths to find .env.local
const envPaths = [
  path.resolve(process.cwd(), ".env.local"),
  path.resolve(__dirname, ".env.local"),
]

let loaded = false
for (const envPath of envPaths) {
  try {
    const result = config({ path: envPath, override: true })
    if (result.parsed && Object.keys(result.parsed).length > 0) {
      loaded = true
      break
    }
  } catch (error) {
    // Continue to next path
  }
}

// Also load .env if it exists
if (!loaded) {
  config() // Load .env
}

// Supabase connection pooler uses a self-signed intermediate cert that Node rejects by default.
// The pooler URL is safe (traffic is still TLS-encrypted); we just skip chain verification.
// Matches the behavior of lib/db/prisma.ts when DATABASE_INSECURE_TLS=1.
{
  const dbUrl = process.env.DATABASE_URL || ""
  const isPooler = dbUrl.includes("pooler.supabase.com") || dbUrl.includes("pgbouncer=true")
  if (isPooler && !process.env.NODE_TLS_REJECT_UNAUTHORIZED) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
  }
}

// Learn more: https://github.com/testing-library/jest-dom
require("@testing-library/jest-dom")

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    }
  },
  usePathname() {
    return "/"
  },
  useSearchParams() {
    return new URLSearchParams()
  },
}))

// Mock NextAuth
jest.mock("next-auth/react", () => ({
  useSession: jest.fn(() => ({
    data: null,
    status: "unauthenticated",
  })),
  signIn: jest.fn(),
  signOut: jest.fn(),
}))
