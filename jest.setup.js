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
