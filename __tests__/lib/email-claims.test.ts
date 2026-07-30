/**
 * @jest-environment node
 */
jest.mock("@/lib/resend", () => ({
  resend: null,
  FROM_EMAIL: "test@example.com",
}));

import { buildChecklistEmail } from "@/lib/email/checklist-content";

describe("checklist email claims", () => {
  it("uses the current one-time offer and conservative checklist guidance", () => {
    const payload = buildChecklistEmail("https://www.freshstart-il.com");
    const content = `${payload.subject}\n${payload.html}\n${payload.text}`;

    expect(content).toContain("$149 one-time");
    expect(content).toMatch(/60 days of service access/i);
    expect(content).toContain("official court forms are available free");
    expect(content).toContain("not a law firm");
    expect(content).toContain("plan=one_time");
    expect(content).not.toMatch(/free.{0,10}trial|4 required forms|serve spouse within 30 days/i);
    expect(content).not.toMatch(/Cook \$388|DuPage \$349|Will ~?\$299/i);
    expect(content).not.toMatch(/href=["'][^"']*\/auth\/signup["']/i);
  });
});
