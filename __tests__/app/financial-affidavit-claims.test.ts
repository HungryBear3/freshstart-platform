import { readFileSync } from "fs";
import { join } from "path";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("Financial Affidavit claim boundaries", () => {
  it("does not categorically claim every Illinois divorce requires an affidavit", () => {
    const sources = [
      read("app/legal-info/process/page.tsx"),
      read("lib/forms/illinois-court-forms.ts"),
      read("app/dashboard/financial/page.tsx"),
    ].join("\n");
    expect(sources).not.toMatch(/required in all divorce cases|Both spouses must complete|information is required for divorce proceedings/i);
    expect(sources).toMatch(/may be required|if (?:the court|your case) requires/i);
  });
});
