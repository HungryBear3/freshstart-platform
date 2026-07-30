/** @jest-environment node */
const mockGetToken = jest.fn();
const mockFindUnique = jest.fn();

jest.mock("next-auth/jwt", () => ({
  getToken: (...args: unknown[]) => mockGetToken(...args),
}));
jest.mock("@/lib/db", () => ({
  prisma: { user: { findUnique: (...args: unknown[]) => mockFindUnique(...args) } },
}));

import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";

const request = () => new NextRequest("http://localhost/api/admin/test");

describe("requireAdmin current-role verification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetToken.mockResolvedValue({ sub: "admin_1", email: "admin@example.com", role: "admin" });
  });

  it("accepts a signed admin token only when the current database role is admin", async () => {
    mockFindUnique.mockResolvedValue({ id: "admin_1", email: "admin@example.com", role: "admin" });
    const result = await requireAdmin(request());
    expect(result.error).toBeNull();
    expect(result.user).toEqual({ id: "admin_1", email: "admin@example.com", role: "admin" });
  });

  it("rejects a formerly-admin JWT after database demotion", async () => {
    mockFindUnique.mockResolvedValue({ id: "admin_1", email: "admin@example.com", role: "user" });
    const result = await requireAdmin(request());
    expect(result.user).toBeNull();
    expect(result.error?.status).toBe(403);
  });

  it("fails closed when current role verification is unavailable", async () => {
    mockFindUnique.mockRejectedValue(new Error("database unavailable"));
    const result = await requireAdmin(request());
    expect(result.user).toBeNull();
    expect(result.error?.status).toBe(503);
  });
});
