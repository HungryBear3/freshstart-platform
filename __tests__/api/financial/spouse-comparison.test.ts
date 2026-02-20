/**
 * Integration tests for spouse financial comparison API
 * @jest-environment node
 */

jest.mock("@/lib/db", () => {
  const { getTestPrisma } = require("@/__tests__/setup/test-prisma");
  let prismaInstance: any = null;
  return {
    get prisma() {
      if (!prismaInstance) {
        prismaInstance = getTestPrisma();
      }
      return prismaInstance;
    },
  };
});

import { GET, POST, DELETE } from "@/app/api/financial/spouse-comparison/route";
import { NextRequest } from "next/server";
import { prisma } from "@/__tests__/setup/integration-setup";
import { getCurrentUser } from "@/lib/auth/session";

jest.mock("@/lib/auth/session", () => ({
  getCurrentUser: jest.fn(),
}));

describe("Spouse Comparison API", () => {
  let testUser: any;
  let testEmail: string;

  beforeEach(async () => {
    testEmail = `test-spouse-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
    testUser = await prisma.user.create({
      data: {
        email: testEmail,
        password: "hashed",
        name: "Test User",
      },
    });
    (getCurrentUser as jest.Mock).mockResolvedValue({
      id: testUser.id,
      email: testEmail,
    });
  });

  afterEach(async () => {
    try {
      await prisma.spouseFinancialRecord.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    } catch {
      // ignore
    }
    (getCurrentUser as jest.Mock).mockReset();
  });

  describe("GET", () => {
    it("should return comparison data without spouse when none exists", async () => {
      const req = new NextRequest("http://localhost/api/financial/spouse-comparison");
      const res = await GET(req);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json).toHaveProperty("hasUserData");
      expect(json).toHaveProperty("hasSpouseData");
      expect(json).toHaveProperty("discrepancies");
    });

    it("should require authentication", async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue(null);
      const req = new NextRequest("http://localhost/api/financial/spouse-comparison");
      const res = await GET(req);
      expect(res.status).toBe(401);
    });
  });

  describe("POST", () => {
    it("should reject without authorization confirmation", async () => {
      const req = new NextRequest("http://localhost/api/financial/spouse-comparison", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: { income: [], expenses: [], assets: [], debts: [] },
          authorizationConfirmed: false,
        }),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("should create spouse financial record with authorization", async () => {
      const spouseData = {
        income: [
          { type: "wages", source: "Employer", amount: 4500, frequency: "monthly", isCurrent: true },
        ],
        expenses: [
          { category: "housing", description: "Rent", amount: 1500, frequency: "monthly" },
        ],
        assets: [{ type: "bank_account", description: "Savings", value: 10000, ownership: "joint" }],
        debts: [],
      };
      const req = new NextRequest("http://localhost/api/financial/spouse-comparison", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: spouseData,
          authorizationConfirmed: true,
        }),
      });
      const res = await POST(req);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);

      const record = await prisma.spouseFinancialRecord.findFirst({
        where: { userId: testUser.id },
      });
      expect(record).toBeDefined();
      const data = record!.data as any;
      expect(data.income).toHaveLength(1);
      expect(data.income[0].amount).toBe(4500);
    });
  });

  describe("DELETE", () => {
    it("should delete spouse records", async () => {
      await prisma.spouseFinancialRecord.create({
        data: {
          userId: testUser.id,
          data: { income: [], expenses: [], assets: [], debts: [] },
          authorizationConfirmedAt: new Date(),
        },
      });
      const req = new NextRequest("http://localhost/api/financial/spouse-comparison", {
        method: "DELETE",
      });
      const res = await DELETE(req);
      expect(res.status).toBe(200);
      const count = await prisma.spouseFinancialRecord.count({
        where: { userId: testUser.id },
      });
      expect(count).toBe(0);
    });
  });
});
