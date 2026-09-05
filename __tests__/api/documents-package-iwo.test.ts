/**
 * @jest-environment node
 *
 * RUNTIME tests for the document-package release boundary.
 *
 * These drive the REAL handler produced by `createDocumentPackageHandler` and
 * then OPEN THE GENERATED ZIP with JSZip, asserting on actual entries, their
 * byte lengths, and their SHA-256. Metadata-only assertions would not prove
 * what the archive contains, so every check here reads the archive itself.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import JSZip from "jszip";

import {
  createDocumentPackageHandler,
  type PackageDocumentRow,
  type PackageHandlerDeps,
} from "@/lib/documents/package-handler";
import { IWO_PROVENANCE, type IwoRenewalEvidence } from "@/lib/forms/iwo-provenance";
import { GUARDED_ARTIFACT_DIR } from "@/lib/forms/official-artifact-access";
import { withheldItemsNotice } from "@/lib/forms/iwo-refusal-copy";

const RENEWAL_CONFIRMED: IwoRenewalEvidence = {
  status: "confirmed",
  reviewedOn: "2026-05-01",
  source: "test-only injected evidence",
};
const RENEWAL_PENDING: IwoRenewalEvidence = {
  status: "pending",
  reviewedOn: "2026-05-01",
  source: "test-only injected evidence",
};

/**
 * TEST-ONLY open-path disclosure approval.
 *
 * The pinned product state is `pending`, so distribution is held closed for
 * every real caller. These fixtures inject an approved state ONLY where the test
 * needs the authorized-open path in order to exercise something else — the
 * payload pin, the alias classifier, the exact archive bytes. It asserts nothing
 * about whether the owner has approved anything; it is a dependency, and the
 * `productionLike*` helpers below deliberately do not pass it.
 */
const DISCLOSURE_APPROVED_FOR_TEST = {
  status: "approved" as const,
  requestedOn: "2026-09-05",
  decisionRecord: "test-only injected approval",
  ledgerRecord: "test-only injected approval",
};

/** >60 days before expiry so the renewal-review window is not open. */
const OPEN_CLOCK = () => new Date("2026-05-01T12:00:00Z");

const CANONICAL_PDF = fs.readFileSync(path.join(GUARDED_ARTIFACT_DIR, IWO_PROVENANCE.file));
const CANONICAL_B64 = CANONICAL_PDF.toString("base64");

const GENERATED_AT = new Date("2026-05-01T00:00:00Z");

function row(over: Partial<PackageDocumentRow> = {}): PackageDocumentRow {
  return {
    type: "petition",
    fileName: "petition.pdf",
    content: Buffer.from("%PDF-1.4\npetition\n").toString("base64"),
    mimeType: "application/pdf",
    generatedAt: GENERATED_AT,
    ...over,
  };
}

function iwoRow(over: Partial<PackageDocumentRow> = {}): PackageDocumentRow {
  return row({
    type: "income_withholding",
    fileName: "income-withholding-order.pdf",
    content: CANONICAL_B64,
    mimeType: "application/pdf",
    ...over,
  });
}

function handlerFor(
  rows: PackageDocumentRow[],
  over: Partial<PackageHandlerDeps> = {},
) {
  return createDocumentPackageHandler({
    getUserId: async () => "user-1",
    loadReadyDocuments: async () => rows,
    loadStoredCounty: async () => "cook",
    loadUser: async () => ({ name: "Test User", email: "t@example.test" }),
    now: OPEN_CLOCK,
    renewalEvidence: RENEWAL_CONFIRMED,
    // This helper means "every policy gate open". Since PR-2A's disclosure hold
    // is one of those gates, it has to be opened here too — otherwise the tests
    // below would pass for the wrong reason, withholding on the hold and never
    // reaching the payload pin they exist to prove.
    disclosureApproval: DISCLOSURE_APPROVED_FOR_TEST,
    ...over,
  });
}

interface OpenedZip {
  entries: string[];
  hasIwoEntry: boolean;
  withheldText: string | null;
  coverText: string;
  rawHasPdfMagic: boolean;
  rawHasFakePayload: boolean;
}

async function openZip(res: Response): Promise<OpenedZip> {
  expect(res.status).toBe(200);
  expect(res.headers.get("Content-Type")).toBe("application/zip");
  const raw = Buffer.from(await res.arrayBuffer());
  const zip = await JSZip.loadAsync(raw);
  const entries = Object.keys(zip.files).filter((n) => !zip.files[n].dir).sort();
  const withheld = zip.file("00_WITHHELD_ITEMS.txt");
  const cover = zip.file("00_COVER_SHEET.txt");
  return {
    entries,
    hasIwoEntry: entries.some((e) => e.includes("income-withholding-order")),
    withheldText: withheld ? await withheld.async("string") : null,
    coverText: cover ? await cover.async("string") : "",
    rawHasPdfMagic: raw.includes(Buffer.from("%PDF")),
    // Compressed archives will not contain the literal marker, so decompress
    // every entry and look inside.
    rawHasFakePayload: (
      await Promise.all(
        entries.map((n) => zip.files[n].async("string").catch(() => "")),
      )
    ).some((t) => t.includes("%PDF-FAKE")),
  };
}

async function iwoEntryBytes(res: Response): Promise<Buffer | null> {
  const zip = await JSZip.loadAsync(Buffer.from(await res.arrayBuffer()));
  const name = Object.keys(zip.files).find((n) => n.includes("income-withholding-order"));
  if (!name) return null;
  return Buffer.from(await zip.files[name].async("nodebuffer"));
}

/** Every withheld case must satisfy this: absent from the archive AND disclosed. */
async function expectWithheldAndDisclosed(res: Response) {
  const z = await openZip(res);
  expect(z.hasIwoEntry).toBe(false);
  expect(z.withheldText).not.toBeNull();
  expect(z.withheldText).toMatch(/income-withholding-order\.pdf/);
  expect(z.coverText).not.toMatch(/income-withholding-order/);
  return z;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1-5. Payload failures: policy open, bytes bad.
// ─────────────────────────────────────────────────────────────────────────────
describe("payload verification at the release boundary", () => {
  it("1. withholds a %PDF-FAKE IWO even with every policy gate open", async () => {
    const fake = Buffer.from("%PDF-FAKE").toString("base64");
    const res = await handlerFor([row(), iwoRow({ content: fake })])();
    const z = await expectWithheldAndDisclosed(res);
    expect(z.withheldText).toMatch(/wrong_byte_length|wrong_sha256/);
    expect(z.entries).toContain("documents/petition.pdf");
  });

  it("2. withholds a truncated copy of the pinned print", async () => {
    const truncated = CANONICAL_PDF.subarray(0, CANONICAL_PDF.length - 1).toString("base64");
    const z = await expectWithheldAndDisclosed(
      await handlerFor([row(), iwoRow({ content: truncated })])(),
    );
    expect(z.withheldText).toMatch(/wrong_byte_length/);
  });

  it("3. withholds an IWO row with missing content", async () => {
    const z = await expectWithheldAndDisclosed(
      await handlerFor([row(), iwoRow({ content: null })])(),
    );
    expect(z.withheldText).toMatch(/missing_content/);
  });

  it("4. withholds an IWO row with invalid base64", async () => {
    const z = await expectWithheldAndDisclosed(
      await handlerFor([row(), iwoRow({ content: "!!!!not base64!!!!" })])(),
    );
    expect(z.withheldText).toMatch(/invalid_base64/);
  });

  it("5. withholds an IWO row with the wrong MIME type", async () => {
    const z = await expectWithheldAndDisclosed(
      await handlerFor([row(), iwoRow({ mimeType: "text/plain" })])(),
    );
    expect(z.withheldText).toMatch(/wrong_mime_type/);
  });

  it("also withholds a byte-swapped payload of exactly the right length", async () => {
    const swapped = Buffer.from(CANONICAL_PDF);
    swapped[swapped.length - 1] ^= 0xff;
    expect(swapped.length).toBe(IWO_PROVENANCE.expectedBytes);
    const z = await expectWithheldAndDisclosed(
      await handlerFor([row(), iwoRow({ content: swapped.toString("base64") })])(),
    );
    expect(z.withheldText).toMatch(/wrong_sha256/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Positive control — exact bytes in the archive.
// ─────────────────────────────────────────────────────────────────────────────
describe("authorized exact payload", () => {
  it("6. includes the IWO at exactly 505,412 bytes with the exact pinned SHA-256", async () => {
    const res = await handlerFor([row(), iwoRow()])();
    const bytes = await iwoEntryBytes(res);

    expect(bytes).not.toBeNull();
    expect(bytes!.length).toBe(505412);
    expect(bytes!.length).toBe(IWO_PROVENANCE.expectedBytes);
    expect(crypto.createHash("sha256").update(bytes!).digest("hex")).toBe(
      IWO_PROVENANCE.expectedSha256,
    );
    expect(bytes!.subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("discloses nothing when the payload is exact and gates are open", async () => {
    const z = await openZip(await handlerFor([row(), iwoRow()])());
    expect(z.hasIwoEntry).toBe(true);
    expect(z.withheldText).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Correct bytes, closed policy gates.
// ─────────────────────────────────────────────────────────────────────────────
describe("policy gates still bind exact bytes", () => {
  it("7a. withholds an exact IWO for a Will case", async () => {
    const z = await expectWithheldAndDisclosed(
      await handlerFor([row(), iwoRow()], { loadStoredCounty: async () => "will" })(),
    );
    expect(z.withheldText).toMatch(/county_manual_conditional/);
  });

  it("7b. withholds an exact IWO for a free-text stored county", async () => {
    const z = await expectWithheldAndDisclosed(
      await handlerFor([row(), iwoRow()], { loadStoredCounty: async () => "Cook County" })(),
    );
    expect(z.withheldText).toMatch(/county_unknown_or_noncanonical/);
  });

  it("7c. withholds an exact IWO while renewal is pending", async () => {
    const z = await expectWithheldAndDisclosed(
      await handlerFor([row(), iwoRow()], { renewalEvidence: RENEWAL_PENDING })(),
    );
    expect(z.withheldText).toMatch(/federal_artifact_gate_closed/);
  });

  it("7d. withholds an exact IWO when the canonical artifact is missing", async () => {
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), "pkg-noartifact-"));
    await expectWithheldAndDisclosed(
      await handlerFor([row(), iwoRow()], { artifactDir: empty })(),
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8-10. Disclosure vs. 404.
// ─────────────────────────────────────────────────────────────────────────────
describe("disclosure is preserved when everything is withheld", () => {
  it("8. returns a ZIP with the disclosure and no PDF bytes when only a withheld IWO existed", async () => {
    const res = await handlerFor([iwoRow({ content: Buffer.from("%PDF-FAKE").toString("base64") })])();
    const z = await openZip(res);

    expect(z.hasIwoEntry).toBe(false);
    expect(z.entries).toContain("00_WITHHELD_ITEMS.txt");
    expect(z.withheldText).toMatch(/income-withholding-order\.pdf/);
    // No document entries at all, and no PDF magic anywhere in the archive.
    expect(z.entries.filter((e) => e.startsWith("documents/"))).toEqual([]);
    expect(z.rawHasPdfMagic).toBe(false);
  });

  it("9. keeps the petition, discloses the IWO, and omits the IWO entry", async () => {
    const z = await openZip(
      await handlerFor([row(), iwoRow()], { loadStoredCounty: async () => "will" })(),
    );
    expect(z.entries).toContain("documents/petition.pdf");
    expect(z.hasIwoEntry).toBe(false);
    expect(z.withheldText).not.toBeNull();
  });

  it("10. still returns 404 when there were no ready documents at all", async () => {
    const res = await handlerFor([])();
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toMatch(/No documents found/i);
  });

  it("returns 401 without an authenticated user", async () => {
    const res = await handlerFor([row()], { getUserId: async () => null })();
    expect(res.status).toBe(401);
  });

  it("never lets the cover sheet claim a withheld item was included", async () => {
    const z = await openZip(
      await handlerFor([row(), iwoRow()], { renewalEvidence: RENEWAL_PENDING })(),
    );
    expect(z.coverText).toMatch(/petition/i);
    expect(z.coverText).not.toMatch(/income-withholding/i);
    expect(z.coverText).not.toMatch(/withholding for support/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Documented bare alias: "Withholding Order" is the SAME instrument as the IWO.
// A row using the bare alias must not bypass classification and therefore must
// not bypass the county, currentness, artifact, hash, or length gates.
// ─────────────────────────────────────────────────────────────────────────────
describe("bare 'Withholding Order' alias", () => {
  const FAKE_PAYLOAD = "%PDF-FAKE-BARE-WITHHOLDING-ORDER";

  function aliasRow(over: Partial<PackageDocumentRow> = {}): PackageDocumentRow {
    return row({
      type: "withholding_order",
      fileName: "withholding-order.pdf",
      content: Buffer.from(FAKE_PAYLOAD).toString("base64"),
      mimeType: "application/pdf",
      ...over,
    });
  }

  /**
   * Production-like: stored county `will`, and renewal evidence deliberately
   * NOT injected so the pinned (pending) evidence applies, exactly as the real
   * route would supply it.
   */
  function productionLikeHandler(rows: PackageDocumentRow[]) {
    return createDocumentPackageHandler({
      getUserId: async () => "user-1",
      loadReadyDocuments: async () => rows,
      loadStoredCounty: async () => "will",
      loadUser: async () => ({ name: "Test User", email: "t@example.test" }),
      now: OPEN_CLOCK,
      // renewalEvidence intentionally omitted -> pinned PENDING
    });
  }

  it.each([
    { type: "withholding_order", fileName: "withholding-order.pdf" },
    { type: "Withholding Order", fileName: "order.pdf" },
    { type: "support", fileName: "Withholding Order.pdf" },
  ])("withholds and discloses a fake alias row %p under Will + pinned pending renewal", async (shape) => {
    const res = await productionLikeHandler([row(), aliasRow(shape)])();
    const z = await openZip(res);

    // Absent from the archive.
    expect(z.entries.some((e) => /withholding[-_ ]?order/i.test(e))).toBe(false);
    // Disclosed by name, with a refusal reason.
    expect(z.withheldText).not.toBeNull();
    expect(z.withheldText).toMatch(new RegExp(shape.fileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
    expect(z.withheldText).toMatch(/county_manual_conditional|federal_artifact_gate_closed|wrong_|missing_|invalid_/);
    // Cover sheet must not claim it.
    expect(z.coverText).not.toMatch(/withholding/i);
    // The fake payload must not survive anywhere in the archive.
    expect(z.rawHasFakePayload).toBe(false);
    // Unrelated documents still ship.
    expect(z.entries).toContain("documents/petition.pdf");
  });

  it("withholds a bare-alias row even when it is the only ready document", async () => {
    const z = await openZip(await productionLikeHandler([aliasRow()])());
    expect(z.entries.filter((e) => e.startsWith("documents/"))).toEqual([]);
    expect(z.entries).toContain("00_WITHHELD_ITEMS.txt");
    expect(z.rawHasPdfMagic).toBe(false);
    expect(z.rawHasFakePayload).toBe(false);
  });

  it("positive control: releases EXACT canonical bytes under a bare alias when every gate is open", async () => {
    const res = await handlerFor([
      row(),
      aliasRow({ content: CANONICAL_B64, fileName: "Withholding Order.pdf" }),
    ])();

    const zip = await JSZip.loadAsync(Buffer.from(await res.arrayBuffer()));
    const name = Object.keys(zip.files).find((n) => /withholding/i.test(n));
    expect(name).toBeDefined();

    const bytes = Buffer.from(await zip.files[name!].async("nodebuffer"));
    expect(bytes.length).toBe(505412);
    expect(crypto.createHash("sha256").update(bytes).digest("hex")).toBe(
      "2b15c02a46b66a7d0fa2bd80d4644d5d6d5e6798911225f8e0272b45fe20b551",
    );
    expect(zip.file("00_WITHHELD_ITEMS.txt")).toBeNull();
  });

  it("still withholds exact canonical bytes under a bare alias when policy is closed", async () => {
    const z = await openZip(
      await handlerFor(
        [row(), aliasRow({ content: CANONICAL_B64 })],
        { loadStoredCounty: async () => "will" },
      )(),
    );
    expect(z.entries.some((e) => /withholding/i.test(e))).toBe(false);
    expect(z.withheldText).toMatch(/county_manual_conditional/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Unrelated withholding documents must pass through untouched. Classifying a
// tax/payroll document as the federal IWO would both suppress it and attach an
// inaccurate county/currentness disclosure.
// ─────────────────────────────────────────────────────────────────────────────
describe("unrelated withholding documents are not suppressed", () => {
  const UNRELATED_PAYLOAD = "%PDF-UNRELATED-W4-TAX-WITHHOLDING";

  /** Production-like: Will county, pinned PENDING renewal (not injected). */
  function productionLike(rows: PackageDocumentRow[]) {
    return createDocumentPackageHandler({
      getUserId: async () => "user-1",
      loadReadyDocuments: async () => rows,
      loadStoredCounty: async () => "will",
      loadUser: async () => ({ name: "Test User", email: "t@example.test" }),
      now: OPEN_CLOCK,
      // renewalEvidence intentionally omitted -> pinned PENDING
    });
  }

  it.each([
    { type: "tax_document", fileName: "Employee Tax Withholding Certificate.pdf" },
    { type: "tax_withholding", fileName: "employee-w4.pdf" },
    { type: "payroll", fileName: "Payroll Withholding Notice.pdf" },
    { type: "support_order", fileName: "support-order.pdf" },
    // Qualified supersets: contain an identity phrase but are not the
    // evidence-defined federal instrument.
    { type: "tax_document", fileName: "State Tax Withholding Order.pdf" },
    { type: "tax_document", fileName: "Employee Income Withholding Election.pdf" },
    { type: "tax_document", fileName: "Income Withholding Certificate.pdf" },
    { type: "payroll", fileName: "Payroll Withholding Order Notice.pdf" },
  ])("ships %p unchanged, with no IWO disclosure", async (shape) => {
    const content = Buffer.from(UNRELATED_PAYLOAD).toString("base64");
    const res = await productionLike([row(), row({ ...shape, content })])();

    expect(res.status).toBe(200);
    const zip = await JSZip.loadAsync(Buffer.from(await res.arrayBuffer()));
    const entry = zip.file(`documents/${shape.fileName}`);

    // Present, and byte-identical to what went in.
    expect(entry).not.toBeNull();
    const bytes = Buffer.from(await entry!.async("nodebuffer"));
    expect(bytes.toString()).toBe(UNRELATED_PAYLOAD);
    expect(crypto.createHash("sha256").update(bytes).digest("hex")).toBe(
      crypto.createHash("sha256").update(Buffer.from(UNRELATED_PAYLOAD)).digest("hex"),
    );

    // No disclosure file at all — nothing was withheld.
    expect(zip.file("00_WITHHELD_ITEMS.txt")).toBeNull();

    // Cover sheet truthfully lists it, and no IWO copy leaked in.
    const cover = await zip.file("00_COVER_SHEET.txt")!.async("string");
    expect(cover).toContain(shape.fileName);
    // The document's own name may legitimately contain "Income Withholding"
    // (e.g. "Employee Income Withholding Election"), so assert on the canonical
    // artifact and on IWO procedural disclosure language instead.
    expect(cover).not.toContain("income-withholding-order.pdf");
    expect(cover).not.toMatch(/OMB 0970/i);
    expect(cover).not.toMatch(/Rule 8\.09|ATJ 127\.3|renewal review/i);
  });

  it("withholds ONLY the real IWO from a mixed package containing a qualified superset", async () => {
    const taxContent = Buffer.from(UNRELATED_PAYLOAD).toString("base64");
    const res = await productionLike([
      row({ type: "tax_document", fileName: "State Tax Withholding Order.pdf", content: taxContent }),
      iwoRow({ content: Buffer.from("%PDF-FAKE").toString("base64") }),
    ])();

    const zip = await JSZip.loadAsync(Buffer.from(await res.arrayBuffer()));
    const superset = zip.file("documents/State Tax Withholding Order.pdf");

    // The qualified superset ships byte-identically.
    expect(superset).not.toBeNull();
    const bytes = Buffer.from(await superset!.async("nodebuffer"));
    expect(bytes.toString()).toBe(UNRELATED_PAYLOAD);
    expect(crypto.createHash("sha256").update(bytes).digest("hex")).toBe(
      crypto.createHash("sha256").update(Buffer.from(UNRELATED_PAYLOAD)).digest("hex"),
    );

    // Only the real IWO is withheld and disclosed.
    expect(zip.file("documents/income-withholding-order.pdf")).toBeNull();
    const withheldText = await zip.file("00_WITHHELD_ITEMS.txt")!.async("string");
    expect(withheldText).toMatch(/income-withholding-order\.pdf/);
    expect(withheldText).not.toMatch(/State Tax Withholding Order/);

    // Cover sheet truthfully lists the superset and not the withheld IWO.
    const cover = await zip.file("00_COVER_SHEET.txt")!.async("string");
    expect(cover).toContain("State Tax Withholding Order.pdf");
    expect(cover).not.toContain("income-withholding-order.pdf");
  });

  it("withholds a real IWO while shipping an unrelated tax withholding doc in the same package", async () => {
    const taxContent = Buffer.from(UNRELATED_PAYLOAD).toString("base64");
    const res = await productionLike([
      row({ type: "tax_document", fileName: "Employee Tax Withholding Certificate.pdf", content: taxContent }),
      iwoRow({ content: Buffer.from("%PDF-FAKE").toString("base64") }),
    ])();

    const z = await openZip(res);
    // The unrelated document ships.
    expect(z.entries).toContain("documents/Employee Tax Withholding Certificate.pdf");
    // The real IWO is withheld and disclosed — and only it.
    expect(z.hasIwoEntry).toBe(false);
    expect(z.withheldText).toMatch(/income-withholding-order\.pdf/);
    expect(z.withheldText).not.toMatch(/Employee Tax Withholding Certificate/);
    expect(z.rawHasFakePayload).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// T-77 — the disclosure text in a real archive is the approved copy, exactly,
// and names the cause that actually closed the gate.
// ─────────────────────────────────────────────────────────────────────────────
describe("00_WITHHELD_ITEMS.txt carries the approved disclosure verbatim", () => {
  /** 2027-08-25 00:00 CDT — the legacy transition end, the first blocked
   *  Chicago calendar day. Not the 2026-08-31 date printed on the form. */
  const EXPIRED_CLOCK = () => new Date("2027-08-25T05:00:00Z");

  it("names the expiration when expiration is what closed the gate", async () => {
    const z = await openZip(
      await handlerFor([row(), iwoRow()], { now: EXPIRED_CLOCK })(),
    );

    expect(z.hasIwoEntry).toBe(false);
    expect(z.withheldText).not.toBeNull();
    expect(z.withheldText).toContain(withheldItemsNotice("federal_form_authority_expired")[0]);
    // The false sentence this PR retired must not appear anywhere in the archive.
    expect(z.withheldText).not.toMatch(/published information-collection approval/);
    expect(z.withheldText).not.toMatch(/renewal/i);
  });

  it("names the renewal review when renewal review is what closed the gate", async () => {
    const z = await openZip(
      await handlerFor([row(), iwoRow()], { renewalEvidence: RENEWAL_PENDING })(),
    );

    expect(z.hasIwoEntry).toBe(false);
    expect(z.withheldText).toContain(withheldItemsNotice("federal_form_renewal_pending")[0]);
    expect(z.withheldText).not.toMatch(/published information-collection approval/);
  });

  it("names the missing file when the artifact is absent", async () => {
    const empty = fs.mkdtempSync(path.join(os.tmpdir(), "pkg-withheld-copy-"));
    const z = await openZip(
      await handlerFor([row(), iwoRow()], { artifactDir: empty })(),
    );

    expect(z.hasIwoEntry).toBe(false);
    expect(z.withheldText).toContain(withheldItemsNotice("federal_artifact_missing")[0]);
  });

  it("ships ZERO IWO bytes alongside the disclosure", async () => {
    const z = await openZip(
      await handlerFor([row(), iwoRow()], { now: EXPIRED_CLOCK })(),
    );

    expect(z.entries.some((e) => /withholding/i.test(e))).toBe(false);
    expect(z.coverText).not.toMatch(/withholding/i);
    // The petition still ships; only the IWO is withheld.
    expect(z.entries).toContain("documents/petition.pdf");
  });
});
