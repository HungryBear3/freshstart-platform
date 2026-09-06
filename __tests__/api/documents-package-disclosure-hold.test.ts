/**
 * @jest-environment node
 *
 * The document package under the OPEN-PATH DISCLOSURE HOLD.
 *
 * This is the one withholding cause that carries NO approved customer-facing
 * wording. `filterIwoFromPackage` correctly returns `notice: []` for it — the
 * hold is Fresh Start's own release decision, and inventing a sentence for it,
 * or borrowing another cause's approved sentence, would both be wrong.
 *
 * The package handler then had to decide what to put in a customer ZIP with no
 * approved prose available. It wrote the disclosure file anyway, so the archive
 * shipped the RAW INTERNAL REFUSAL TOKEN `open_path_disclosure_unapproved` to
 * the customer with nothing explaining it.
 *
 * Both available substitutes are refused deliberately:
 *   - the handler's federal-mismatch fallback ("did not match the verified
 *     federal print") is FALSE here — the pinned artifact matches exactly; and
 *   - the proposed open-path variants in the decision record are UNAPPROVED.
 *
 * So the archive says nothing about a hold-withheld item, exactly as every
 * other held surface (availability copy, packet deferral copy, filter notice)
 * already says nothing. Zero IWO bytes either way.
 *
 * These tests drive the REAL handler at PRODUCTION DEFAULTS: no injected
 * disclosure approval, no injected renewal evidence, the real pinned artifact.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import JSZip from "jszip";

import {
  createDocumentPackageHandler,
  type PackageDocumentRow,
} from "@/lib/documents/package-handler";
import { IWO_PROVENANCE } from "@/lib/forms/iwo-provenance";
import { GUARDED_ARTIFACT_DIR } from "@/lib/forms/official-artifact-access";
import { IWO_OPEN_PATH_DISCLOSURE_REFUSAL } from "@/lib/forms/iwo-distribution-hold";
import { IWO_OPERATIVE_REFUSAL_COPY } from "@/lib/forms/iwo-refusal-copy";

const CANONICAL_PDF = fs.readFileSync(path.join(GUARDED_ARTIFACT_DIR, IWO_PROVENANCE.file));
const CANONICAL_B64 = CANONICAL_PDF.toString("base64");

const DECISION_DOC = path.join(
  process.cwd(),
  "docs/legal-audit/iwo-open-path-disclosure-copy-decision-2026-09-05.md",
);

/** Inside the legacy transition window and outside the renewal-review window. */
const OPEN_CLOCK = () => new Date("2026-05-01T12:00:00Z");
const GENERATED_AT = new Date("2026-05-01T00:00:00Z");

/** Plain text so the only PDF magic that can appear in the archive is the IWO's. */
function petitionRow(): PackageDocumentRow {
  return {
    type: "petition",
    fileName: "petition.txt",
    content: "PETITION BODY",
    mimeType: "text/plain",
    generatedAt: GENERATED_AT,
  };
}

function iwoRow(over: Partial<PackageDocumentRow> = {}): PackageDocumentRow {
  return {
    type: "income_withholding",
    fileName: "income-withholding-order.pdf",
    content: CANONICAL_B64,
    mimeType: "application/pdf",
    generatedAt: GENERATED_AT,
    ...over,
  };
}

/**
 * PRODUCTION DEFAULTS. `disclosureApproval` and `renewalEvidence` are
 * deliberately NOT injected, so the pinned constants apply: renewal confirmed,
 * artifact valid, every federal gate open — and the open-path disclosure hold
 * is the single thing that closes the gate. That is the exact configuration the
 * real route runs today.
 */
function productionHandler(rows: PackageDocumentRow[], county = "cook") {
  return createDocumentPackageHandler({
    getUserId: async () => "user-1",
    loadReadyDocuments: async () => rows,
    loadStoredCounty: async () => county,
    loadUser: async () => ({ name: "Test User", email: "t@example.test" }),
    now: OPEN_CLOCK,
  });
}

interface Opened {
  entries: string[];
  texts: string[];
  allText: string;
  withheldText: string | null;
  coverText: string;
  rawHasPdfMagic: boolean;
  carriesCanonicalBytes: boolean;
}

async function open(res: Response): Promise<Opened> {
  expect(res.status).toBe(200);
  const raw = Buffer.from(await res.arrayBuffer());
  const zip = await JSZip.loadAsync(raw);
  const entries = Object.keys(zip.files).filter((n) => !zip.files[n].dir).sort();
  const buffers = await Promise.all(
    entries.map((n) => zip.files[n].async("nodebuffer") as Promise<Buffer>),
  );
  const texts = buffers.map((b) => b.toString("utf8"));
  const withheld = zip.file("00_WITHHELD_ITEMS.txt");
  const cover = zip.file("00_COVER_SHEET.txt");
  return {
    entries,
    texts,
    allText: texts.join("\n"),
    withheldText: withheld ? await withheld.async("string") : null,
    coverText: cover ? await cover.async("string") : "",
    rawHasPdfMagic: raw.includes(Buffer.from("%PDF")),
    carriesCanonicalBytes: buffers.some(
      (b) =>
        crypto.createHash("sha256").update(b).digest("hex") === IWO_PROVENANCE.expectedSha256,
    ),
  };
}

/** Every fenced ```text block in the decision record is an UNAPPROVED variant. */
function proposedVariants(): string[] {
  const doc = fs.readFileSync(DECISION_DOC, "utf8");
  return [...doc.matchAll(/```text\n([\s\S]*?)```/g)].map((m) => m[1].trim());
}

describe("document package under the open-path disclosure hold", () => {
  it("emits zero IWO bytes", async () => {
    const z = await open(await productionHandler([petitionRow(), iwoRow()])());

    expect(z.entries.some((e) => /withholding/i.test(e))).toBe(false);
    expect(z.carriesCanonicalBytes).toBe(false);
    expect(z.rawHasPdfMagic).toBe(false);
  });

  it("never writes the raw internal hold token into the archive", async () => {
    const z = await open(await productionHandler([petitionRow(), iwoRow()])());

    expect(z.allText).not.toContain(IWO_OPEN_PATH_DISCLOSURE_REFUSAL);
    expect(z.allText).not.toContain("open_path_disclosure_unapproved");
  });

  it("writes no disclosure file at all, because no approved wording exists", async () => {
    const z = await open(await productionHandler([petitionRow(), iwoRow()])());

    expect(z.withheldText).toBeNull();
    expect(z.entries).not.toContain("00_WITHHELD_ITEMS.txt");
  });

  it("never substitutes the false federal-mismatch fallback", async () => {
    const z = await open(await productionHandler([petitionRow(), iwoRow()])());

    // The pinned artifact matches exactly, so this sentence would be untrue.
    expect(z.allText).not.toMatch(/did not match the verified federal print/i);
    expect(z.allText).not.toMatch(/only releases this form when its contents match/i);
  });

  it("never borrows another cause's approved copy", async () => {
    const z = await open(await productionHandler([petitionRow(), iwoRow()])());

    for (const sentence of Object.values(IWO_OPERATIVE_REFUSAL_COPY).flatMap((c) => [...c])) {
      expect(z.allText).not.toContain(sentence);
    }
  });

  it("never wires an unapproved proposed variant into the archive", async () => {
    const z = await open(await productionHandler([petitionRow(), iwoRow()])());

    const variants = proposedVariants();
    expect(variants.length).toBeGreaterThan(0);
    for (const variant of variants) expect(z.allText).not.toContain(variant);
  });

  it("makes no federal, expiry, or agency claim anywhere in the archive", async () => {
    const z = await open(await productionHandler([petitionRow(), iwoRow()])());

    for (const banned of [/expir/i, /\bomb\b/i, /0970/, /renewal/i, /\bacf\b/i, /withholding/i]) {
      expect(z.allText).not.toMatch(banned);
    }
  });

  it("still ships unrelated documents and never claims the withheld item", async () => {
    const z = await open(await productionHandler([petitionRow(), iwoRow()])());

    expect(z.entries).toContain("documents/petition.txt");
    expect(z.texts.join("")).toContain("PETITION BODY");
    expect(z.coverText).toContain("petition.txt");
    expect(z.coverText).not.toMatch(/income-withholding/i);
  });

  it("returns a ZIP with no document entries when the held IWO was the only ready row", async () => {
    const z = await open(await productionHandler([iwoRow()])());

    expect(z.entries.filter((e) => e.startsWith("documents/"))).toEqual([]);
    expect(z.entries).not.toContain("00_WITHHELD_ITEMS.txt");
    expect(z.rawHasPdfMagic).toBe(false);
    expect(z.allText).not.toContain(IWO_OPEN_PATH_DISCLOSURE_REFUSAL);
  });

  it.each([
    { type: "withholding_order", fileName: "withholding-order.pdf" },
    { type: "support", fileName: "Withholding Order.pdf" },
    { type: "iwo", fileName: "form.pdf" },
    { type: "support", fileName: "OMB 0970-0154.pdf" },
  ])("holds documented alias %p with no token and no bytes", async (shape) => {
    const z = await open(await productionHandler([petitionRow(), iwoRow(shape)])());

    expect(z.carriesCanonicalBytes).toBe(false);
    expect(z.rawHasPdfMagic).toBe(false);
    expect(z.allText).not.toContain(IWO_OPEN_PATH_DISCLOSURE_REFUSAL);
    expect(z.withheldText).toBeNull();
    expect(z.entries).toContain("documents/petition.txt");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// The hold must not silence causes that DO have approved, truthful copy.
// ─────────────────────────────────────────────────────────────────────────────
describe("other withholding causes still disclose", () => {
  it("a Will county case still gets its approved county disclosure", async () => {
    const z = await open(await productionHandler([petitionRow(), iwoRow()], "will")());

    expect(z.withheldText).not.toBeNull();
    expect(z.withheldText).toMatch(/income-withholding-order\.pdf/);
    expect(z.withheldText).toMatch(/county_manual_conditional/);
    expect(z.carriesCanonicalBytes).toBe(false);
  });

  it("a free-text stored county still gets its approved county disclosure", async () => {
    const z = await open(await productionHandler([petitionRow(), iwoRow()], "Cook County")());

    expect(z.withheldText).not.toBeNull();
    expect(z.withheldText).toMatch(/county_unknown_or_noncanonical/);
    expect(z.carriesCanonicalBytes).toBe(false);
  });
});
