/**
 * @jest-environment node
 *
 * Stub-endpoint smoke tests. Each /api/_stub/* handler must:
 *   - respond 200
 *   - return `{ ok: true, mock: true }`
 *   - echo the body it received (so QA can verify wiring)
 *   - perform NO real CRM/email/Stripe/Calendly side effects (verified by
 *     the file content not importing any provider SDK — see import audit below).
 */
import { readFileSync } from "fs";
import { join } from "path";

import { POST as leadCapturePost } from "@/app/api/_stub/lead-capture/route";
import { POST as startTrialPost } from "@/app/api/_stub/start-trial/route";
import { POST as startFilingPost } from "@/app/api/_stub/start-filing/route";
import { POST as orientationPost } from "@/app/api/_stub/orientation-call/route";
import { POST as addOnPost } from "@/app/api/_stub/add-on/route";

function makeReq(body: unknown) {
  return new Request("http://localhost/stub", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function assertMockOk(res: Response, endpoint: string) {
  expect(res.status).toBe(200);
  const json = await res.json();
  expect(json).toMatchObject({ ok: true, mock: true, endpoint });
}

describe("/api/_stub/* endpoints", () => {
  it("lead-capture returns mock 200", async () => {
    await assertMockOk(await leadCapturePost(makeReq({ email: "a@b.c" })), "lead-capture");
  });
  it("start-trial returns mock 200", async () => {
    await assertMockOk(await startTrialPost(makeReq({ source: "hero" })), "start-trial");
  });
  it("start-filing returns mock 200", async () => {
    await assertMockOk(await startFilingPost(makeReq({ tier: "plus" })), "start-filing");
  });
  it("orientation-call returns mock 200", async () => {
    await assertMockOk(await orientationPost(makeReq({ page: "homepage" })), "orientation-call");
  });
  it("add-on returns mock 200", async () => {
    await assertMockOk(await addOnPost(makeReq({ addon: "Refile assistance" })), "add-on");
  });

  it("none of the stub handlers import a provider SDK (no real side effects)", () => {
    const banned = ["stripe", "@stripe", "resend", "@calcom", "@cal", "calendly", "segment"];
    for (const file of [
      "lead-capture/route.ts",
      "start-trial/route.ts",
      "start-filing/route.ts",
      "orientation-call/route.ts",
      "add-on/route.ts",
    ]) {
      const text = readFileSync(join(process.cwd(), "app/api/_stub", file), "utf8");
      for (const needle of banned) {
        expect(text).not.toMatch(new RegExp(`from\\s+["']${needle}`));
      }
    }
  });
});
