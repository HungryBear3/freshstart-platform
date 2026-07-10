# FreshStart IL — Illinois Court Form Drift Matrix

**Date:** 2026-07-10 · **Scope:** reconcile local divorce/support/financial form catalog vs current Illinois Supreme Court approved forms.
**Status:** ⚠ **UNVERIFIED AGAINST OFFICIAL SOURCE.** No launch/deploy. No catalog version, legal copy, or checkout mutation made by this pass (hard stops honored).

> Not legal advice — this is a copy/version drift audit. Actual currency vs. illinoiscourts.gov must be confirmed by the operator-run `--fetch` step **and** human/counsel review before any form is treated as current or generation is re-enabled.

---

## 1. Headline

- The local catalog (`lib/forms/illinois-court-forms.ts`, **21 forms**) and the checked-in manifest (`docs/legal-audit/illinois-court-forms-manifest.json`) **agree internally** — but the manifest was seeded *from* the catalog and has **never been verified against the official Illinois pages**: `lastFetchedAt: null`, and `verification: null` for **all 21 forms**.
- **Therefore there is no local ground-truth of "current Illinois versions" to diff against.** Offline reconciliation can only surface *structural* drift + verification gaps, not confirm real form currency.
- Three concrete, offline-verifiable problems make the catalog **not safe to treat as current**: (a) **0 form PDFs ship** (`public/forms/` holds only a README); (b) **field mappings are unvalidated guesses**; (c) the **freshness guard already pauses 14 of 21 forms** and its remaining "pass" is a self-asserted date, not a verification.

---

## 2. Drift matrix (21 forms)

Legend — **Guard**: PASS/PAUSE from `form-freshness-guard.ts` (`lastUpdated ≥ gate`). **Verified**: manifest `verification` block (all `null` = never fetched). **PDF**: file present in `public/forms/`. **Fields**: field-map validated against a real PDF.

| # | Form (id) | Catalog ver / lastUpdated | Freshness gate | Guard | Verified vs official | PDF | Fields |
|---|---|---|---|---|---|---|---|
| 1 | petition-no-children | 2024 / 2024‑01‑01 | 2025‑03‑01 | **PAUSE** | ❌ null | ❌ | ❌ |
| 2 | petition-with-children | 2024 / 2024‑01‑01 | 2025‑03‑01 | **PAUSE** | ❌ null | ❌ | ❌ |
| 3 | summons | 2024 / 2024‑01‑01 | 2025‑03‑01 | **PAUSE** | ❌ null | ❌ | n/a |
| 4 | appearance | 2024 / 2024‑01‑01 | 2025‑03‑01 | **PAUSE** | ❌ null | ❌ | n/a |
| 5 | financial-affidavit | 2025 / 2025‑06‑01 | 2025‑06‑01 | PASS* | ❌ null | ❌ | ❌ |
| 6 | schedule-a-child-support | 2025 / 2025‑06‑01 | 2025‑06‑01 | PASS* | ❌ null | ❌ | ❌ |
| 7 | schedule-b-health-insurance | 2025 / 2025‑06‑01 | 2025‑06‑01 | PASS* | ❌ null | ❌ | ❌ |
| 8 | schedule-c-debts | 2025 / 2025‑06‑01 | 2025‑06‑01 | PASS* | ❌ null | ❌ | ❌ |
| 9 | schedule-d-accounts | 2025 / 2025‑06‑01 | 2025‑06‑01 | PASS* | ❌ null | ❌ | ❌ |
| 10 | schedule-e-business | 2025 / 2025‑06‑01 | 2025‑06‑01 | PASS* | ❌ null | ❌ | ❌ |
| 11 | schedule-f-retirement | 2025 / 2025‑06‑01 | 2025‑06‑01 | PASS* | ❌ null | ❌ | ❌ |
| 12 | parenting-plan | 2024 / 2024‑01‑01 | 2025‑03‑01 | **PAUSE** | ❌ null | ❌ | ❌ |
| 13 | allocation-judgment | 2024 / 2024‑01‑01 | 2025‑03‑01 | **PAUSE** | ❌ null | ❌ | n/a |
| 14 | certificate-of-service | 2024 / 2024‑01‑01 | 2025‑03‑01 | **PAUSE** | ❌ null | ❌ | n/a |
| 15 | affidavit-service-special-process | 2024 / 2024‑01‑01 | 2025‑03‑01 | **PAUSE** | ❌ null | ❌ | n/a |
| 16 | waiver-service | 2024 / 2024‑01‑01 | 2025‑03‑01 | **PAUSE** | ❌ null | ❌ | n/a |
| 17 | judgment-no-children | 2024 / 2024‑01‑01 | 2025‑03‑01 | **PAUSE** | ❌ null | ❌ | n/a |
| 18 | judgment-with-children | 2024 / 2024‑01‑01 | 2025‑03‑01 | **PAUSE** | ❌ null | ❌ | n/a |
| 19 | marital-settlement-agreement | 2024 / 2024‑01‑01 | 2025‑03‑01 | **PAUSE** | ❌ null | ❌ | n/a |
| 20 | child-support-order | 2024 / 2024‑01‑01 | 2025‑09‑01 | **PAUSE** | ❌ null | ❌ | n/a |
| 21 | income-withholding-order | 2024 / 2024‑01‑01 | 2025‑09‑01 | **PAUSE** | ❌ null | ❌ | n/a |

**Totals:** Guard PASS = 7 (all financial-affidavit suite) · Guard PAUSE = 14 (all divorce + support) · Verified-vs-official = **0/21** · PDFs present = **0/21**.

`*` **PASS is not "verified current."** The guard only checks `catalog.lastUpdated ≥ gateDate`; `lastUpdated` is a hand-entered catalog string never checked against illinoiscourts.gov. A form can "pass" by editing a date. Treat all 7 "PASS" forms as **date-satisfied but unverified**.

---

## 3. Structural drift findings (offline-certain)

1. **Never fetched.** `verify-illinois-forms.ts --fetch` has not run (`lastFetchedAt: null`, all `verification: null`). No form has been reconciled to the live official pages. **This is the top gap.**
2. **Version scheme can't detect real revisions.** Catalog `version` is a bare year (`"2024"`/`"2025"`); official IL standardized forms carry an "Approved/Revised MM/YY" stamp. A mid-year revision to a 2024 form would be invisible to this scheme.
3. **Freshness guard is date-threshold, not verification.** It keys off self-asserted `catalog.lastUpdated`, not `manifest.verification`. It gives false confidence for the financial suite and can be satisfied by a copy edit. It **should** gate on a real verified marker.
4. **Guard currently pauses core product.** Divorce (12) and support (2) generation returns `official_forms_need_review` today (fail-closed — *good* safety, but the divorce/support product is effectively blocked until dates are verified upward).
5. **Zero PDFs ship.** `public/forms/` = README only → `checkFormExists()` false for all; the "fill the official PDF" path has no PDFs to fill.
6. **Field mappings are unvalidated.** `field-mappings.ts` self-documents: *"These mappings need to be verified against the actual PDF forms once downloaded."* PDF field names (`PetitionerFirstName`, …) are guesses. If wrong (or the official PDF was revised), fillers emit blank/misfiled documents — the **highest-severity silent drift**.
7. **Known-revised forms to confirm (do NOT assert without --fetch + counsel):** Illinois has revised the **Financial Affidavit** and the **child-support / income-withholding** forms in recent cycles. The catalog's `2025‑06‑01` financial date and `2024‑01‑01` support date are plausible-but-unconfirmed; the support forms in particular look stale vs. the 2025‑09‑01 gate. Confirm exact current revisions from the official source — no revision codes are invented here.

---

## 4. Affected templates / routes / tests

**Catalog / data**
- `lib/forms/illinois-court-forms.ts` — the 21-form catalog (source of drift).
- `docs/legal-audit/illinois-court-forms-manifest.json` — verification manifest (all `null`).
- `docs/legal-audit/ILLINOIS_FORMS_FRESHNESS.md` — human report (in-flight/dirty).

**Guard / generation (live behavior)**
- `lib/forms/form-freshness-guard.ts` — gates; pauses 14 forms *(new, uncommitted)*.
- `app/api/documents/generate/route.ts:147` — calls `freshnessPauseResponsePayload([...])` *(dirty)*.
- `app/api/documents/package/route.ts:53` — same *(dirty)*.

**Fillers (drift-sensitive to PDF field names)**
- `lib/document-generation/official-forms/field-mappings.ts` — unvalidated field maps.
- `…/petition-filler.ts`, `…/financial-affidavit-filler.ts`, `…/parenting-plan-filler.ts`, `…/index.ts`.

**Public surface**
- `app/legal-info/court-forms/page.tsx` — lists all 21 forms + versions to customers.
- `public/forms/` — target dir for the missing PDFs.

**Tooling / tests**
- `scripts/verify-illinois-forms.ts` *(dirty)* — `--offline` (ran: catalog↔manifest agree) / `--fetch` (operator, network).
- `__tests__/forms/verify-illinois-forms.test.ts` — diff engine (passing).
- `__tests__/forms/form-freshness-guard.test.ts` — asserts the 2025‑03‑01 / 2025‑09‑01 / 2025‑06‑01 gates and that divorce+support pause *(new, uncommitted)*.

*Offline verifier result:* `catalog and manifest agree on every form`. *Form tests:* 10 passed.

---

## 5. Safe patch — what is clear now vs. gated

**Clear + safe (this artifact):** this drift matrix. Pure documentation; no catalog/version/legal-copy/behavior change.

**NOT a safe auto-patch (must be gated, human/counsel review):**
- Bumping any `version` / `lastUpdated` — that is a legal-accuracy claim; requires `--fetch` evidence + review. **Do not edit dates to clear the guard.**
- Changing guard gate dates or wiring — behavioral + legal.
- Downloading official PDFs + rewriting field maps — must be validated against the real PDFs (`pdf-lib form.getFields()`), then counsel-reviewed.
- Any public court-forms page copy change.

**Recommended gated remediation order (operator + HER-76/counsel):**
1. Run `tsx scripts/verify-illinois-forms.ts --fetch` (operator, network) → populate `manifest.verification` (HTTP/Last-Modified/etag) and the freshness report. Advisory only.
2. Human/counsel confirm the **current revision** of each form on illinoiscourts.gov (esp. Financial Affidavit + support forms).
3. Only then, in a reviewed branch: update catalog `version`/`lastUpdated` to verified values, download the matching PDFs into `public/forms/`, and validate `field-mappings.ts` against the real PDF fields.
4. Re-point the freshness guard to gate on `manifest.verification`, not self-asserted dates.
5. Regenerate + review sample documents before re-enabling divorce/support generation.

---

## 6. Attestation

No production deploy. No catalog `version`/`lastUpdated` change. No legal copy or public/checkout mutation. No PDFs downloaded or asserted current. No `--fetch`/network run. Only read-only offline verification (`--offline`) + form tests were executed. All currency claims remain **unverified pending operator `--fetch` + counsel review**.
