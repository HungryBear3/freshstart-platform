/**
 * Integration tests for user registration API
 * @jest-environment node
 */

import { POST } from "@/app/api/auth/register/route"
import { NextRequest } from "next/server"
import { prisma } from "@/__tests__/setup/integration-setup"

// Mock rate limiter to avoid rate limit issues in tests
jest.mock("@/lib/rate-limit", () => ({
  rateLimit: jest.fn(() => ({
    allowed: true,
    remaining: 10,
    resetTime: Date.now() + 900000,
  })),
  getClientIdentifier: jest.fn(() => "test-client"),
}))

describe("POST /api/auth/register", () => {
  const createRequest = (body: any) => {
    return new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })
  }

  beforeEach(async () => {
    // Clean up test users (including duplicate@example.com)
    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { startsWith: "test" } },
          { email: "duplicate@example.com" },
        ],
      },
    })
  })

  it("should register a new user with valid data", async () => {
    const request = createRequest({
      email: "test@example.com",
      password: "password123",
      name: "Test User",
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data).toHaveProperty("user")
    expect(data.user.email).toBe("test@example.com")
    expect(data.user.name).toBe("Test User")
    expect(data.user).not.toHaveProperty("password")

    // Verify user was created in database
    const user = await prisma.user.findUnique({
      where: { email: "test@example.com" },
    })
    expect(user).toBeTruthy()
    expect(user?.email).toBe("test@example.com")
  })

  it("should reject registration with invalid email", async () => {
    const request = createRequest({
      email: "invalid-email",
      password: "password123",
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty("error")
  })

  it("should reject registration with short password", async () => {
    const request = createRequest({
      email: "test2@example.com",
      password: "short",
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty("error")
  })

  it("should reject registration with duplicate email", async () => {
    // Create existing user
    await prisma.user.create({
      data: {
        email: "duplicate@example.com",
        password: "hashedpassword",
      },
    })

    const request = createRequest({
      email: "duplicate@example.com",
      password: "password123",
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty("error")
    expect(data.error).toContain("already exists")
  })

  it("should sanitize email to lowercase", async () => {
    const request = createRequest({
      email: "Test@Example.COM",
      password: "password123",
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.user.email).toBe("test@example.com")

    // Verify lowercase in database
    const user = await prisma.user.findUnique({
      where: { email: "test@example.com" },
    })
    expect(user?.email).toBe("test@example.com")
  })

  it("should sanitize user name", async () => {
    const request = createRequest({
      email: "test3@example.com",
      password: "password123",
      name: "<script>alert('xss')</script>Test User",
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.user.name).not.toContain("<script>")
  })

  it("should handle missing required fields", async () => {
    const request = createRequest({
      email: "test4@example.com",
      // Missing password
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty("error")
  })

  it("should handle malformed JSON", async () => {
    const request = new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: "invalid json{",
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data).toHaveProperty("error")
  })
})
