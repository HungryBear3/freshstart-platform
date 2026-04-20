// Load .env.local before any Jest config so DATABASE_URL is available for the TLS check below
const path = require("path")
try {
  require("dotenv").config({ path: path.resolve(__dirname, ".env.local"), override: true })
} catch {}

// Supabase connection pooler uses an intermediate cert that Node's TLS rejects by default.
// Set this flag in the main process so it's inherited by every Jest worker via fork.
{
  const dbUrl = process.env.DATABASE_URL || ""
  if ((dbUrl.includes("pooler.supabase.com") || dbUrl.includes("pgbouncer=true")) &&
      !process.env.NODE_TLS_REJECT_UNAUTHORIZED) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
  }
}

const nextJest = require("next/jest")

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: [
    "**/__tests__/**/*.test.ts",
    "**/__tests__/**/*.test.tsx",
    "!**/node_modules/**",
  ],
  // Use jsdom for React components, node for API tests
  // Tests in __tests__/api will use node environment via testEnvironment override
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  collectCoverageFrom: [
    "lib/**/*.{js,jsx,ts,tsx}",
    "app/api/**/*.{js,jsx,ts,tsx}",
    "components/**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
