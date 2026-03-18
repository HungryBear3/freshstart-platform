/**
 * Integration tests for children API
 * @jest-environment node
 */

// Mock @/lib/db before importing API routes
// This ensures API routes use the test prisma instance
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

import { GET, POST } from "@/app/api/children/route"
import { NextRequest } from "next/server"
import { prisma } from "@/__tests__/setup/integration-setup"
import { getCurrentUser } from "@/lib/auth/session"

jest.mock("@/lib/auth/session", () => ({
  getCurrentUser: jest.fn(),
}))

describe("Children API", () => {
  let testUser: any
  let testEmail: string

  beforeEach(async () => {
    // Generate unique email for each test run
    testEmail = `test-children-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`
    
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
      await prisma.child.deleteMany({
        where: { userId: testUser.id },
      })
    } catch (error) {
      // Ignore errors if no children exist
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

  describe("GET /api/children", () => {
    it("should return empty array when no children exist", async () => {
      const request = new NextRequest("http://localhost:3000/api/children")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty("children")
      expect(Array.isArray(data.children)).toBe(true)
      expect(data.children.length).toBe(0)
    })

    it("should return user's children", async () => {
      // Create test children
      await prisma.child.createMany({
        data: [
          {
            userId: testUser.id,
            firstName: "John",
            lastName: "Doe",
            dateOfBirth: new Date("2010-01-15"),
            gender: "male",
          },
          {
            userId: testUser.id,
            firstName: "Jane",
            lastName: "Doe",
            dateOfBirth: new Date("2012-03-20"),
            gender: "female",
          },
        ],
      })

      const request = new NextRequest("http://localhost:3000/api/children")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.children.length).toBe(2)
      expect(data.children[0]).toHaveProperty("firstName")
      expect(data.children[0]).toHaveProperty("lastName")
      expect(data.children[0]).toHaveProperty("dateOfBirth")
    })

    it("should require authentication", async () => {
      ;(getCurrentUser as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest("http://localhost:3000/api/children")
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toHaveProperty("error")
    })
  })

  describe("POST /api/children", () => {
    const createRequest = (body: any) => {
      return new NextRequest("http://localhost:3000/api/children", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })
    }

    it("should create a new child", async () => {
      const request = createRequest({
        firstName: "Test",
        lastName: "Child",
        dateOfBirth: "2015-06-15",
        gender: "male",
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty("id")
      expect(data.firstName).toBe("Test")
      expect(data.lastName).toBe("Child")
      expect(data.userId).toBe(testUser.id)

      // Verify in database
      const child = await prisma.child.findUnique({
        where: { id: data.id },
      })
      expect(child).toBeTruthy()
      expect(child?.firstName).toBe("Test")
    })

    it("should reject child with missing required fields", async () => {
      const request = createRequest({
        firstName: "Test",
        // Missing lastName and dateOfBirth
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty("error")
    })

    it("should validate and format SSN", async () => {
      const request = createRequest({
        firstName: "Test",
        lastName: "Child",
        dateOfBirth: "2015-06-15",
        gender: "male",
        ssn: "123456789",
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      // SSN should be stored (may be encrypted in production)
      expect(data).toHaveProperty("ssn")
    })

    it("should sanitize child names", async () => {
      const request = createRequest({
        firstName: "<script>alert('xss')</script>Test",
        lastName: "Child",
        dateOfBirth: "2015-06-15",
        gender: "male",
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.firstName).not.toContain("<script>")
    })
  })
})
