/** @jest-environment node */
import { NextRequest } from "next/server";
import { POST } from "@/app/api/financial/child-support/route";

describe("POST /api/financial/child-support", () => {
  it("returns 410 while the formula is not independently validated", async () => {
    const request = new NextRequest("http://localhost/api/financial/child-support", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        parent1NetIncome: 5000,
        parent2NetIncome: 3000,
        numberOfChildren: 1,
        parentingTimeParent1: 50,
        parentingTimeParent2: 50,
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(410);
    expect(await response.json()).toEqual({
      error: "Child-support calculator unavailable pending independent formula validation",
    });
  });
});
