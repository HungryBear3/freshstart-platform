/**
 * Integration tests for financial data API
 * @jest-environment node
 */

// Mock @/lib/db before importing API routes
jest.mock("@/lib/db", () => {
  const { getTestPrisma } = require("@/__tests__/setup/test-prisma")
  let prismaInstance: any = null
  
  return {
    get prisma() {
      if (!prismaInstance) {
        prismaInstance = getTestPrisma()
      }
      return prismaInstance
    },
  }
})

import { GET, POST } from "@/app/api/financial/route"
import { NextRequest } from "next/server"
import { prisma } from "@/__tests__/setup/integration-setup"
import { getCurrentUser } from "@/lib/auth/session"

jest.mock("@/lib/auth/session", () => ({
  getCurrentUser: jest.fn(),
}))

describe("Financial Data API", () => {
  let testUser: any
  let testEmail: string

  beforeEach(async () => {
    // Generate unique email for each test run
    testEmail = `test-financial-data-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`
    
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: testEmail,
        password: "hashedpassword",
        name: "Test User",
      },
    })

    ;(getCurrentUser as jest.Mock).mockResolvedValue({
      id: testUser.id,
      email: testEmail,
    })
  })

  afterEach(async () => {
    // Clean up - handle cases where records might not exist
    try {
      const financialData = await prisma.financialData.findUnique({
        where: { userId: testUser.id },
      })
      if (financialData) {
        await prisma.incomeSource.deleteMany({
          where: { financialDataId: financialData.id },
        })
        await prisma.expense.deleteMany({
          where: { financialDataId: financialData.id },
        })
        await prisma.asset.deleteMany({
          where: { financialDataId: financialData.id },
        })
        await prisma.debt.deleteMany({
          where: { financialDataId: financialData.id },
        })
        await prisma.financialData.delete({
          where: { id: financialData.id },
        })
      }
    } catch (error) {
      // Ignore errors if financialData doesn't exist
    }
    try {
      await prisma.user.delete({
        where: { id: testUser.id },
      })
    } catch (error) {
      // Ignore errors if user doesn't exist
    }
    ;(getCurrentUser as jest.Mock).mockReset()
  })

  describe("GET /api/financial", () => {
    it("should return empty financial data when none exists", async () => {
      const request = new NextRequest("http://localhost:3000/api/financial")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty("formType")
      expect(data).toHaveProperty("income")
      expect(data).toHaveProperty("expenses")
      expect(data).toHaveProperty("assets")
      expect(data).toHaveProperty("debts")
      expect(Array.isArray(data.income)).toBe(true)
    })

    it("should return user's financial data", async () => {
      // Create financial data with related records
      const financialData = await prisma.financialData.create({
        data: {
          userId: testUser.id,
          formType: "short",
          income: {
            create: {
              type: "salary",
              source: "Salary",
              amount: 5000,
              frequency: "monthly",
            },
          },
          expenses: {
            create: {
              category: "Housing",
              description: "Rent",
              amount: 1500,
              frequency: "monthly",
            },
          },
        },
        include: {
          income: true,
          expenses: true,
        },
      })

      const request = new NextRequest("http://localhost:3000/api/financial")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.income.length).toBe(1)
      expect(data.expenses.length).toBe(1)
      expect(data.income[0].amount).toBe(5000)
    })

    it("should require authentication", async () => {
      ;(getCurrentUser as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest("http://localhost:3000/api/financial")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toHaveProperty("error")
    })
  })

  describe("POST /api/financial", () => {
    const createRequest = (body: any) => {
      return new NextRequest("http://localhost:3000/api/financial", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })
    }

    it("should create income source", async () => {
      const request = createRequest({
        formType: "short",
        income: [
          {
            type: "salary",
            source: "Salary",
            amount: 5000,
            frequency: "monthly",
          },
        ],
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty("income")
      expect(data.income.length).toBe(1)
      expect(data.income[0].source).toBe("Salary")
      expect(data.income[0].amount).toBe(5000)
    })

    it("should create expense", async () => {
      const request = createRequest({
        formType: "short",
        expenses: [
          {
            category: "Housing",
            description: "Rent",
            amount: 1500,
            frequency: "monthly",
          },
        ],
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty("expenses")
      expect(data.expenses.length).toBe(1)
      expect(data.expenses[0].category).toBe("Housing")
      expect(data.expenses[0].amount).toBe(1500)
    })

    it("should validate amount is positive", async () => {
      const request = createRequest({
        formType: "short",
        income: [
          {
            type: "salary",
            source: "Salary",
            amount: -1000, // Invalid negative amount
            frequency: "monthly",
          },
        ],
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty("error")
    })

    it("should reject invalid form type", async () => {
      const request = createRequest({
        formType: "invalid",
        income: [],
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty("error")
    })
  })
})
