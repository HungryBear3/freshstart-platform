/** @jest-environment node */
import { POST as childSupportPost } from "@/app/api/financial/child-support/route";
import { POST as maintenancePost } from "@/app/api/financial/spousal-maintenance/route";

const readJson = async (response: Response) => ({ status: response.status, body: await response.json() });

describe("unsupported financial calculators", () => {
  it("fails closed for direct child-support API requests", async () => {
    expect(await readJson(await childSupportPost())).toEqual({
      status: 410,
      body: { error: "Child-support calculator unavailable pending independent formula validation" },
    });
  });

  it("fails closed for direct maintenance API requests", async () => {
    expect(await readJson(await maintenancePost())).toEqual({
      status: 410,
      body: { error: "Maintenance calculator unavailable pending independent formula validation" },
    });
  });
});
