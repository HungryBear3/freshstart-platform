/**
 * Integration tests for case milestones API
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

import { GET, POST } from "@/app/api/case/milestones/route"
import { NextRequest } from "next/server"
import { prisma } from "@/__tests__/setup/integration-setup"
import { getCurrentUser } from "@/lib/auth/session"

jest.mock("@/lib/auth/session", () => ({
  getCurrentUser: jest.fn(),
}))

describe("Case Milestones API", () => {
  let testUser: any
  let testEmail: string

  beforeEach(async () => {
    // Generate unique email for each test run
    testEmail = `test-case-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`
    
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: testEmail,
        password: "hashedpassword",
        name: "Test User",
      },
    })

    // Mock authenticated user
    ;(getCurrentUser as jest.Mock).mockResolvedValue({
      id: testUser.id,
      email: testEmail,
    })
  })

  afterEach(async () => {
    // Clean up - handle cases where records might not exist
    try {
      const caseInfo = await prisma.caseInfo.findUnique({
        where: { userId: testUser.id },
      })
      if (caseInfo) {
        await prisma.milestone.deleteMany({
          where: { caseInfoId: caseInfo.id },
        })
        await prisma.caseInfo.delete({
          where: { id: caseInfo.id },
        })
      }
    } catch (error) {
      // Ignore errors if caseInfo doesn't exist
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

  describe("GET /api/case/milestones", () => {
    it("should return empty array when no milestones exist", async () => {
      const request = new NextRequest("http://localhost:3000/api/case/milestones")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty("milestones")
      expect(Array.isArray(data.milestones)).toBe(true)
      expect(data.milestones.length).toBe(0)
    })

    it("should return user's milestones", async () => {
      // Create case info first
      const caseInfo = await prisma.caseInfo.create({
        data: { userId: testUser.id },
      })

      // Create test milestones
      await prisma.milestone.createMany({
        data: [
          {
            caseInfoId: caseInfo.id,
            title: "Petition Filed",
            date: new Date("2024-01-15"),
            description: "Initial petition filed",
          },
          {
            caseInfoId: caseInfo.id,
            title: "Response Received",
            date: new Date("2024-02-01"),
            description: "Response from other party",
          },
        ],
      })

      const request = new NextRequest("http://localhost:3000/api/case/milestones")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.milestones.length).toBe(2)
      expect(data.milestones[0]).toHaveProperty("title")
      expect(data.milestones[0]).toHaveProperty("date")
    })

    it("should require authentication", async () => {
      ;(getCurrentUser as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest("http://localhost:3000/api/case/milestones")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toHaveProperty("error")
    })
  })

  describe("POST /api/case/milestones", () => {
    const createRequest = (body: any) => {
      return new NextRequest("http://localhost:3000/api/case/milestones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })
    }

    it("should create a new milestone", async () => {
      const request = createRequest({
        title: "Test Milestone",
        date: "2024-01-15",
        description: "Test description",
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty("id")
      expect(data.title).toBe("Test Milestone")

      // Verify in database
      const milestone = await prisma.milestone.findUnique({
        where: { id: data.id },
      })
      expect(milestone).toBeTruthy()
      expect(milestone?.title).toBe("Test Milestone")
    })

    it("should reject milestone with missing required fields", async () => {
      const request = createRequest({
        // Missing title
        date: "2024-01-15",
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty("error")
    })

    it("should reject invalid date format", async () => {
      const request = createRequest({
        title: "Test Milestone",
        date: "invalid-date",
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty("error")
    })

    it("should sanitize milestone title", async () => {
      const request = createRequest({
        title: "<script>alert('xss')</script>Test Milestone",
        date: "2024-01-15",
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.title).not.toContain("<script>")
    })
  })
})
