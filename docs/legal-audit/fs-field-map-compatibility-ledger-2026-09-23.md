# FreshStart Illinois form catalog — mapping ledger and field-map compatibility

**Date:** 2026-09-23
**Base:** `origin/main` @ `416ae5f`
**Lane:** Fresh Start official-form recovery — committed as `587dc31` on
`alexy/fs-field-map-closure-20260923` and open as PR #23 against `main`; not merged
**Disposition:** **NO UNPAUSE.** Nothing here is generation, download, packet, filing, or release
authority. Fresh Start is not a law firm and does not give legal advice.

---

## 0. What the launch packet asked for, and what was already released

The launch packet describes a catalog with "20 entries pointing to suite index pages, 13 stale 2024
version labels, no corresponding public PDFs, and several identities that do not map one-to-one to
current official statewide forms." **That state no longer exists on the authoritative branch.**

The packet's two `current-*.ts` evidence snapshots are byte-identical to the working checkout's
detached `HEAD` (`2e165d2`, the PR-2A IWO stack) and differ from `origin/main`. `origin/main` has
since merged PR #21 (`2a82931`, "fix(forms): reconcile catalog and close generation paths"), which
consumed the same 2026-09-14 evidence packet supplied here — `docs/legal-audit/fs-form-artifact-reconciliation-2026-09-14.md`
is already committed on `origin/main`, differing from the packet copy only in trailing whitespace.

Steps 4–8 of the packet brief are therefore **already delivered upstream** and were not redone:

| Packet requirement | State on `origin/main` @ `416ae5f` |
|---|---|
| Explicit source classification per entry | `FORM_AUTHORITY_CLASSES`, 5 classes, test-enforced |
| Exact artifact binding (URL, code, revision, retrieval, MIME, bytes, SHA-256) | `ArtifactProvenance` on all 16 statewide rows + the federal IWO |
| No suite-index URL as artifact identity | All 16 bind direct `ilcourtsaudio.blob.core.windows.net` PDFs |
| No date-only patching, no silent identity merge | Month-precision versions; `UNVERIFIED_CATALOG_VALUE` sentinel |
| Allocation judgment / Schedule A–F retired | Removed from the catalog entirely |
| Cert. of service / special-process affidavit / waiver unresolved | `unverified_identity`, `unsupported` |
| Marital settlement agreement is not an official form | `freshstart_template` |
| IWO artifact/authority/county/case gates preserved | Untouched; `separately_guarded`, own refusal path |
| No public/static artifact leakage | `getFormPath` throws for all 21 rows |

**The residual gap is the packet's other in-scope item: "questionnaire/field-map compatibility checks
for exact supported artifacts."** The 2026-09-21 review states this explicitly at §7.7 — "Field
mapping and generated-output diffing against the exact current PDFs have not been done for any entry.
That work is out of this lane." It is in scope for this one, and this ledger is its record.

---

## 1. Mapping ledger — 21 catalog entries

Packet classes: `A` = `official_statewide_exact_artifact`, `B` = `official_statewide_requires_mapping_review`,
`C` = `county_or_local_authority`, `D` = `freshstart_template`, `E` = `unsupported_or_unresolved`.

"Field map" names the declared map in `lib/document-generation/official-forms/field-mappings.ts`.
"Q-fields" is the count of that map's `questionnaireField` ids that resolve inside its owning seeded
questionnaire. "Artifact-bound" is whether the map has ever been checked against the pinned PDF.

| # | Catalog id | Printed artifact | Packet class | Field map | Q-fields | Artifact-bound |
|---|---|---|---|---|---|---|
| 1 | `petition-no-children` | ATJ 103.4 (03/25) | B | `PETITION_NO_CHILDREN_FIELD_MAP` | 11/11 (`petition`) | **no** |
| 2 | `petition-with-children` | ATJ 105.3 (03/25) | B | `PETITION_WITH_CHILDREN_FIELD_MAP` | 13/13 (`petition`) | **no** |
| 3 | `summons` | ATJ 113.8 (03/25) | B | `SUMMONS_FIELD_MAP` | 6/6 (`petition`) | **no** |
| 4 | `appearance` | ATJ 111.5 (03/25) | B | — | — | **no map** |
| 5 | `financial-affidavit` | ATJ 251.5 (06/25) | B | `FINANCIAL_AFFIDAVIT_FIELD_MAP` | 73/73 (`financial_affidavit`) | **no** |
| 6 | `financial-additional-child-support` | ATJ 253.1 (06/25) | B | — | — | **no map** |
| 7 | `financial-additional-health-insurance` | ATJ 254.3 (06/25) | B | — | — | **no map** |
| 8 | `financial-additional-debts` | ATJ 255.3 (06/25) | B | — | — | **no map** |
| 9 | `financial-additional-cash` | ATJ 256.3 (06/25) | B | — | — | **no map** |
| 10 | `financial-additional-investments` | ATJ 257.3 (06/25) | B | — | — | **no map** |
| 11 | `financial-additional-business-interests` | ATJ 258.3 (06/25) | B | — | — | **no map** |
| 12 | `financial-additional-life-insurance` | ATJ 259.3 (06/25) | B | — | — | **no map** |
| 13 | `parenting-plan` | ATJ 108.4 (03/25) | B | `PARENTING_PLAN_FIELD_MAP` | 37/37 (`parenting_plan`) | **no** |
| 14 | `judgment-no-children` | ATJ 104.4 (03/25) | B | — | — | **no map** |
| 15 | `judgment-with-children` | ATJ 106.2 (03/25) | B | — | — | **no map** |
| 16 | `certificate-of-service` | none found | E | — | — | n/a |
| 17 | `affidavit-service-special-process` | none found | E | — | — | n/a |
| 18 | `waiver-service` | none found | E | — | — | n/a |
| 19 | `marital-settlement-agreement` | none (FreshStart-authored) | D | — | — | n/a |
| 20 | `child-support-order` | ATJ 129.5 (09/25) | B | — | — | **no map** |
| 21 | `income-withholding-order` | OMB 0970-0154 | B (federal, separately guarded) | — | — | **no map** |

**Class `A` is empty, and class `C` is empty.** No entry reaches `official_statewide_exact_artifact`:
an exact artifact binding is necessary for that class but not sufficient, because none of the 16
statewide rows has a field map that has ever been compared against the artifact it is pinned to.
Class `C` remains empty for the reason the 2026-09-21 review gives at §6.1 — a county claim must be
earned by county evidence, and none exists.

---

## 2. Findings

### F1 — No field map is bound to any artifact (all 21 rows)

`lib/document-generation/official-forms/field-mappings.ts` opens with its own disclaimer:

> "Note: These mappings need to be verified against the actual PDF forms once downloaded."

Nothing in the five maps names a printed form code, a revision, or a SHA-256. Their `pdfField`
values (`PetitionerFirstName`, `DateOfMarriage`, `GrossMonthlyIncome`, …) are **conventional guesses**,
not field names read out of an AcroForm. `PETITION_NO_CHILDREN_FIELD_MAP` is written as though it
fills ATJ 103.4 (03/25) without anything in the repository having opened that artifact.

The exact PDFs are deliberately absent from the repository (`public/forms/README.md`; only the federal
IWO is retained, under `private/official-forms/`). **So compatibility cannot be proved in this lane
— only made executable and fail-closed.** Proving it requires the pinned artifacts and a separately
authorized retrieval.

### F2 — Three ungoverned `/forms/<filename>` path builders bypass `getFormPath`

PR #21 made `getFormPath` throw for all 21 entries. Three other constructions of the same public
static path were left untouched:

- `getFormTemplatePath()` in `official-forms/index.ts` — a 9-entry table returning
  `/forms/<filename>` with no gate at all. Currently has **zero callers** (dead but exported).
- Five hardcoded `const templatePath = '/forms/….pdf'` constants in `petition-filler.ts` (×2),
  `financial-affidavit-filler.ts`, and `parenting-plan-filler.ts`, each fetched directly.

This is the same defect class the 2026-09-21 review closed at §6.2: the artifact was unreachable only
because one early check happened to come first. Here the whole surface is unreachable only because
`app/api/documents/generate/route.ts` returns 409 for `generationMode === "official"` before dispatch.
Move or relax that single return and five `/forms/` fetches become live.

### F3 — `OfficialFormType` carries identities the reconciled catalog does not support

The union still includes `certificate-of-service` (now `unverified_identity`) and
`marital-settlement-agreement` (now `freshstart_template`), and `getFormTemplatePath` gives both a
public artifact path. Nothing binds the union to the catalog, so a row retired or reclassified in
`illinois-court-forms.ts` leaves a live generation identity behind it.

### F4 — `relatedQuestionnaires` names eight questionnaires that do not exist

The catalog rows reference `basic-information`, `financial-information`, `assets-debts`,
`marriage-details`, `children-information`, `parenting-plan`, `income-employment`, and
`property-division`. The questionnaires this product actually defines are **`petition`,
`financial_affidavit`, `parenting_plan`, `marital_settlement`** (`lib/seed-questionnaires.ts`, routed
at `/questionnaires/[type]`). **Not one of the eight slugs resolves.**

Consequences: `getFormsForQuestionnaire()` returns `[]` for every real questionnaire and has no
callers; and the unresolved slugs travel through `court-forms-read-model.ts` into the rendered DTO,
where `court-forms-client.tsx:349` joins and displays them to a customer as the questionnaires that
feed the form. The page is behind a 308 today, so this is not currently reachable — the same
"unreachable by accident" posture as F2.

They are **not** silently remapped to the four real ids here. Which questionnaire feeds which official
artifact is exactly the mapping question this lane cannot prove, and guessing it would repeat the
identity-merge the 2026-09-14 packet exists to stop. The unresolved state is made executable instead.

### F5 — Positive result: the questionnaire half of compatibility holds

Every one of the 140 `questionnaireField` ids across the five maps exists in the seeded questionnaire
structures, and each map draws from a **single** owning questionnaire (with two incidental overlaps
into `marital_settlement`). This matters because generation receives one questionnaire response
object: a map reaching across questionnaires would silently emit blanks. It does not.

So for `petition-no-children`, `petition-with-children`, `summons`, `financial-affidavit` and
`parenting-plan`, the questionnaire side is proven. Artifact-bound PDF-field comparison remains a
blocker for all five. `summons` has the additional, independently enforced blocker that this module
has no summons filler; proving its field map alone cannot make summons generation supported.

### F6 — Incidental: `npm ci` fails on the `prepare` script

`prepare` calls `require('husky').install()`, removed in husky v9 (`^9.1.7` is the pinned range), so
a clean `npm ci` exits 1 unless `CI=1` is set. Pre-existing, unrelated to forms, **not fixed here**.

---

## 3. What this candidate changes

1. `lib/questionnaires/seed-structures.ts` — the questionnaire definitions moved out of
   `lib/seed-questionnaires.ts` verbatim, so they can be read without importing Prisma. The seeder
   imports them back; no definition is edited.
2. `lib/questionnaires/registry.ts` — real questionnaire ids and their question ids, derived from
   those structures. Never a hand-copied list, so it cannot drift from what is seeded.
3. `lib/forms/field-map-compatibility.ts` — declares each field map's target catalog row, its owning
   questionnaire, and the artifact verification it was performed against. Every binding's
   verification is `null` today, so `getFieldMapCompatibility()` returns `artifact_unverified` for
   all five mapped rows, `no_field_map` for the other sixteen, and `isFieldMapCompatibilityProven()`
   is false for all 21.

   A verification is accepted only when **every** recorded fact holds: SHA-256, printed code and
   printed revision all equal the row's pinned `provenance`; `method` says something; and
   `verifiedAt` is a strict `YYYY-MM-DD` real calendar day that is not in the future. Matching bytes
   under a mismatched printed identity means one of the two records is wrong, and a record with no
   method or no real date is not evidence that a comparison happened — either would let a malformed
   entry unlock generation on its own. Defects are reported all at once, not one at a time: a
   reviewer told about a single field learns the record is sound when the complaints stop, which is
   a different thing. `today` is injected, so nothing here depends on the wall clock.
4. `lib/document-generation/official-forms/template-source.ts` — the single choke point for an
   official template location. It throws for every form id until compatibility is proven.
5. F2/F3 closed. `getFormTemplatePath` throws instead of returning a path; the five hardcoded
   `/forms/` constants route through the choke point; `isFormTypeSupported` is decided by proven
   compatibility; `generateOfficialForm` refuses before dispatch, and refuses an id off the catalog
   without crashing on a lookup for a form that does not exist.

   `OFFICIAL_FORM_TYPES` is narrowed from the legacy nine to the **five** ids that are both a
   statewide official catalog row and a bound field map — asserted against that derived set, so the
   literal cannot drift from it. The four removed are recorded in `QUARANTINED_FORM_TYPES` with a
   reason each: `certificate-of-service` (unverified identity), `judgment-no-children` and
   `judgment-with-children` (pinned artifact, no field map ever written), and
   `marital-settlement-agreement` (FreshStart template). They are recorded rather than deleted so
   the fact that this surface once offered to generate a FreshStart-authored document, and one for
   which no official artifact was ever corroborated, is not lost; tests assert the union and the
   quarantine together still account for all nine, and that every quarantined id is refused by
   `isFormTypeSupported`, the template choke point, and `generateOfficialForm`.
6. F4 made executable: the read model resolves `relatedQuestionnaires` against the registry and the
   DTO carries **only** resolved links.

   The unresolved remainder is deliberately **not** on the DTO. `app/legal-info/court-forms/page.tsx`
   hands the DTO array to a client component, so a field that merely goes unrendered is still
   serialized into the page — an unsupported claim shipped to the browser either way. It is exposed
   to server callers by `getUnresolvedQuestionnaireLinkAudit()` instead, which reads the catalog
   directly so a row the model withholds behind a closed gate (the federal IWO) still reports its
   claim. A test scans the serialized payload for the slugs. The catalog rows themselves are left
   exactly as they are, and the client needed no change.

Nothing above enables a lane. Each change moves a surface from "closed by accident" to "closed by
construction", which is the precondition the 2026-09-21 review's §7.7 names, not a substitute for it.

---

## 4. Open blockers — none of these is closed by this candidate

1. **No field map has been compared against its pinned PDF.** This needs the 16 artifacts and a
   separately authorized retrieval; the repository holds none of them.
2. **Generated-output diffing has not been done for any entry** (§7.7 of the 2026-09-21 review).
3. **`relatedQuestionnaires` needs an owner/legal ruling**, not a guess: either the eight slugs are
   replaced with real questionnaire ids on evidence, or the field is retired. Left unresolved here.
4. **The federal IWO address discrepancy** (§7.4 of the 2026-09-21 review) is untouched.
5. **`/legal-info/document-guide` copy** (§7.5) is untouched and still behind its 308.
6. **The seeded structures are the repository's declaration, not the deployed database.**
   `scripts/remediate-current-illinois-grounds.ts` mutates a stored structure directly, so a
   deployed questionnaire can drift from `lib/questionnaires/seed-structures.ts`. Every compatibility
   result here is a statement about the repository.

## 5. Actions not performed

No merge, deploy, environment change, email, filing, court or provider contact, payment, order,
customer document, or database mutation. The candidate itself has since been committed (`587dc31`)
and opened as PR #23 against `main`; that PR is not merged. No official PDF was fetched, replaced, or
regenerated. No production or preview state was touched. No legal advice is given or implied.

---

## 6. Verification of this candidate

Worktree: `/Users/abigailclaw/cc-worktrees/fs-form-recovery-20260923`, based on `416ae5f`
(`origin/main`). The checks below were recorded against that working tree before it was committed
as `587dc31` on `alexy/fs-field-map-closure-20260923` (PR #23). The existing
`/Users/abigailclaw/freshstart-platform` checkout and its untracked files were not touched.

| Check | Command | Result |
|---|---|---|
| Typecheck | `npx tsc --noEmit` | PASS |
| Full suite | `npx jest` | PASS — 89 suites / 1,296 tests; 5 suites / 34 tests skipped by the repository |
| Production build | `npm run build` | PASS — compiled successfully, 128 static pages |
| Offline verifier | `npm run forms:verify:offline` | PASS — 21 catalog entries matched 21 manifest entries |
| Whitespace | `git diff --check` | clean |
| Lint | `npx eslint <changed files>` | 3 pre-existing `no-explicit-any` errors, unchanged from base; no new finding |

New suites, 67 tests: `__tests__/questionnaires/questionnaire-registry.test.ts` (9),
`__tests__/forms/field-map-compatibility.test.ts` (27),
`__tests__/lib/document-generation/official-form-template-closure.test.ts` (21),
`__tests__/forms/court-forms-questionnaire-links.test.ts` (10).

Field-map counts asserted by those suites and reproduced here: 11 / 13 / 6 / 73 / 37 mapping entries
across the five maps, 140 in total, **0** absent from their owning questionnaires, **0** verified
against a pinned artifact.

Not run: `graphify update .`. This repository carries no `AGENTS.md`, this worktree has no
`graphify-out/`, and it is not the checkout the existing graph describes; regenerating a graph here
would create a new index for a different tree.

---

## 7. Review round 1 — three blockers, closed

An independent review of the state above confirmed the base (`origin/main` is exactly `416ae5f`),
reproduced typecheck, the focused tests, the full suite and the Production build, and returned
**BLOCKED** on three issues. All three are closed. Disposition is unchanged: **NO UNPAUSE**, and no
PDF retrieval is authorized.

**7.1 Artifact verification accepted a matching SHA alone.** Correct, and the original wording of §3
overstated what was enforced. A record pairing the right bytes with a wrong printed code, an empty
method, or `"yesterday"` as its date would have been accepted and would have unlocked compatibility.
All five fields are now validated, with `2026-02-30`-style impossible days rejected rather than
silently rolled forward by `new Date`, and a future date rejected against an injected `today`.
Eleven new cases cover it.

**7.2 `OFFICIAL_FORM_TYPES` still carried `certificate-of-service` and `marital-settlement-agreement`.**
Correct, and F3 was described as "closed" when only half of it was: the union had been bound to
catalog ids, which the reclassified rows still are, and nothing required them to be statewide
official rows with a field map. Narrowed to five and quarantined the four, per §3.5.

**7.3 `unresolvedQuestionnaireLinks` shipped to the browser.** Correct. Resolving server-side removed
the unsupported slugs from what is *rendered*, but the diagnostic field sat on the same DTO the page
serializes into the client component — so the claims still crossed to the browser, just silently.
Moved to a server-only audit function, per §3.6.

Re-verification after the fixes: `npx tsc --noEmit` PASS; `npx jest` PASS at 89 suites / 1,296 tests
(5 suites / 34 tests repo-skipped); `npm run build` PASS; `npm run forms:verify:offline` PASS 21↔21;
`git diff --check` clean; `npx eslint` on the changed files reports the same 3 pre-existing
`no-explicit-any` errors as the base and no new finding.
