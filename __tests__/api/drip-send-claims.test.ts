/**
 * @jest-environment node
 */
const mockFindMany = jest.fn();
const mockUpdate = jest.fn();
const mockSendEmail = jest.fn();

jest.mock("@/lib/db", () => ({
  prisma: {
    dripEmail: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

jest.mock("@/lib/email", () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

jest.mock("@/lib/monitoring/error-tracking", () => ({
  errorTracker: {
    captureMessage: jest.fn(),
    captureError: jest.fn(),
  },
}));

import { NextRequest } from "next/server";
import { POST } from "@/app/api/drip/send/route";

function request() {
  return new NextRequest("http://localhost:3000/api/drip/send", {
    method: "POST",
    headers: { authorization: "Bearer test-cron-secret" },
  });
}

describe("FreshStart drip claims", () => {
  const oldSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-cron-secret";
    mockFindMany.mockResolvedValue(
      [1, 2, 3, 4, 5].map((step) => ({
        id: `drip_${step}`,
        email: `person${step}@example.com`,
        step,
        sequence: "fs-checklist",
      })),
    );
    mockUpdate.mockResolvedValue({});
    mockSendEmail.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    if (oldSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = oldSecret;
    jest.clearAllMocks();
  });

  it("sends only the current one-time document-preparation offer", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalledTimes(5);

    const content = mockSendEmail.mock.calls
      .map(([payload]) => `${payload.subject}\n${payload.text}\n${payload.html}`)
      .join("\n");

    expect(content).toContain("$149 one-time");
    expect(content).toMatch(/60 days of service access/i);
    expect(content).toMatch(/official court forms are available free/i);
    expect(content).toContain("not a law firm");
    expect(content).not.toMatch(/\$299|annual|court-ready|ready-to-file/i);
    expect(content).not.toMatch(/every required form|complete divorce packet|no attorney required/i);
    expect(content).not.toMatch(/attorney fees?|\$250.?\$400|\$5,000.?\$15,000/i);
    expect(content).not.toMatch(/most common reason|delayed or rejected|default judgment after 30 days/i);
  });
});
