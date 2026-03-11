/**
 * Unit tests for badge awarding logic
 * @jest-environment node
 */

jest.mock("@/lib/db", () => ({
  prisma: {
    userBadge: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

import { awardBadge } from "@/lib/badges/award-badge"
import { prisma } from "@/lib/db"

const mockFindUnique = prisma.userBadge.findUnique as jest.Mock
const mockCreate = prisma.userBadge.create as jest.Mock

describe("awardBadge", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("returns earned: true when badge is not already owned", async () => {
    mockFindUnique.mockResolvedValue(null)
    mockCreate.mockResolvedValue({ id: "1", userId: "u1", badgeId: "onboarding" })

    const result = await awardBadge("u1", "onboarding")

    expect(result.earned).toBe(true)
    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { userId_badgeId: { userId: "u1", badgeId: "onboarding" } },
    })
    expect(mockCreate).toHaveBeenCalledWith({
      data: { userId: "u1", badgeId: "onboarding" },
    })
  })

  it("returns earned: false when badge is already owned", async () => {
    mockFindUnique.mockResolvedValue({ id: "1", userId: "u1", badgeId: "onboarding" })

    const result = await awardBadge("u1", "onboarding")

    expect(result.earned).toBe(false)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("awards first_petition badge", async () => {
    mockFindUnique.mockResolvedValue(null)
    mockCreate.mockResolvedValue({})

    const result = await awardBadge("u2", "first_petition")

    expect(result.earned).toBe(true)
    expect(mockCreate).toHaveBeenCalledWith({
      data: { userId: "u2", badgeId: "first_petition" },
    })
  })
})
