# FreshStart `relatedQuestionnaires` — owner decision packet

**Date:** 2026-09-23
**Base:** `c680cad` on `alexy/fs-field-map-closure-20260923` (PR #23, open, not merged; `origin/main` @ `416ae5f`)
**Lane:** read-only audit supporting the owner ruling that PR #23 left open
**Disposition:** **NO RULING RECORDED HERE, AND NO UNPAUSE.** This document enumerates, classifies and
recommends. It is not generation, download, packet, filing or release authority, and it does not decide
anything on the owner's behalf.

The audit was performed against `587dc31` and re-verified against `c680cad` after the branch advanced;
every anchor below is stated at `c680cad`. Section 4's generation evidence moved in that commit and the
new location is cited.

**Actions not performed:** no merge, deploy, environment change, Production access, external PDF
retrieval, email, filing, court or provider contact, payment, customer document, or database mutation.
Generation, download and the IWO boundary remain paused. Neither 308 redirect was lifted.

---

## 0. The open question

`lib/forms/illinois-court-forms.ts` carries a `relatedQuestionnaires: string[]` on every catalog row.
Ledger finding **F4** (`fs-field-map-compatibility-ledger-2026-09-23.md` §F4) established that none of
the declared slugs names a questionnaire this product defines, and made the non-resolution *executable*
rather than guessing a replacement. Ledger §4 item 3 and PR #23's follow-up gates both defer the same
ruling: **replace the slugs with real questionnaire ids on evidence, or retire the field.**

Two facts frame it:

- The surface is dormant. `/legal-info/court-forms` is 308'd to `/legal` (`next.config.ts:18`), and
  `/legal-info/document-guide` was closed on 2026-09-21 **specifically** because questionnaire→form
  mapping was out of that lane (`next.config.ts:19-27`). Nothing here is customer-visible today.
- Independent, machine-checked in-repo evidence for a form↔questionnaire relationship **does** exist.
  It lives in a different module than the catalog, which is why F4 could not see it.

---

## 1. Ground truth: the questionnaires that exist

Four, defined in one array and *derived* — never hand-listed — into the registry:

| id (`type`) | defined at | name |
|---|---|---|
| `petition` | `lib/questionnaires/seed-structures.ts:26` | Petition for Dissolution of Marriage |
| `financial_affidavit` | `lib/questionnaires/seed-structures.ts:408` | Financial Affidavit |
| `parenting_plan` | `lib/questionnaires/seed-structures.ts:1161` | Parenting Plan |
| `marital_settlement` | `lib/questionnaires/seed-structures.ts:1692` | Marital Settlement Agreement |

`lib/questionnaires/registry.ts:20-32` derives `isQuestionnaireId` from `SEED_QUESTIONNAIRES`, so the
membership test cannot drift from what is seeded. Ids are **underscore-cased**; `/questionnaires/[type]`
routes on them (`app/questionnaires/page.tsx:129`).

**Caveat that survives any ruling** (already stated at `registry.ts:9-11`): this is a statement about the
*repository*, not the deployed database. `app/api/questionnaires/route.ts:39` still carries
`// TODO: Add admin check` on the POST that creates arbitrary `type` values, and
`scripts/remediate-current-illinois-grounds.ts` mutates a stored structure in place. A deployed
questionnaire set can differ from these four. Nothing here claims otherwise.

---

## 2. Every declaration

Source: `lib/forms/illinois-court-forms.ts` — the `q` shorthand plus inline literals on the rows.

```ts
const q={basic:["basic-information"],financial:["financial-information"],assets:["assets-debts"]}
```

**8 distinct slugs, 31 declaration instances, across 17 of 21 rows** (4 rows already declare `[]`).

| # | Catalog row | Declared |
|---|---|---|
| 1 | `petition-no-children` | `basic-information`, `marriage-details` |
| 2 | `petition-with-children` | `basic-information`, `marriage-details`, `children-information` |
| 3 | `summons` | `basic-information` |
| 4 | `appearance` | — (empty) |
| 5 | `financial-affidavit` | `financial-information`, `income-employment`, `assets-debts` |
| 6 | `financial-additional-child-support` | `financial-information` |
| 7 | `financial-additional-health-insurance` | `financial-information` |
| 8 | `financial-additional-debts` | `assets-debts` |
| 9 | `financial-additional-cash` | `assets-debts` |
| 10 | `financial-additional-investments` | `assets-debts` |
| 11 | `financial-additional-business-interests` | `assets-debts`, `income-employment` |
| 12 | `financial-additional-life-insurance` | `assets-debts` |
| 13 | `parenting-plan` | `children-information`, **`parenting-plan`** (its own row id) |
| 14 | `judgment-no-children` | `basic-information`, `marriage-details`, `assets-debts` |
| 15 | `judgment-with-children` | `basic-information`, `marriage-details`, `children-information`, `parenting-plan` |
| 16 | `certificate-of-service` | — (empty) |
| 17 | `affidavit-service-special-process` | — (empty) |
| 18 | `waiver-service` | — (empty) |
| 19 | `marital-settlement-agreement` | `assets-debts`, `property-division` |
| 20 | `child-support-order` | `financial-information`, `children-information` |
| 21 | `income-withholding-order` | `financial-information` |

---

## 3. What reaches the server, and what reaches the client

**Server path — correct, as PR #23 designed it.**
`app/legal-info/court-forms/page.tsx:20` → `getCourtFormsReadModel()` → `toDto`
(`lib/forms/court-forms-read-model.ts:100-116`) destructures only `{ resolved }` from
`resolveQuestionnaireLinks`. Because zero slugs resolve, **every DTO ships
`relatedQuestionnaires: []` today.** The unresolved remainder is kept off the DTO deliberately and
exposed server-side only through `getUnresolvedQuestionnaireLinkAudit()` (`:179-188`), which reads the
catalog directly so the gate-withheld IWO row still reports its claim.

**Client render.** `app/legal-info/court-forms/court-forms-client.tsx` — plain text, no link, no href
construction: *"Questionnaires that collect information relevant to this form: …"*. The `length > 0`
guard is false for every row, so the block never renders.

**The exposure the DTO boundary does not close — measured, not inferred.**
Before the fix accompanying this document, `court-forms-client.tsx` took a **value** import from
`@/lib/forms/illinois-court-forms` (`FORM_CATEGORIES`, `UNVERIFIED_CATALOG_VALUE`,
`formatCatalogLastUpdated`). `ILLINOIS_COURT_FORMS` is built by top-level `il()` / `unsupported()`
calls in that same module, so no bundler can tree-shake it. Measured against the then-current build,
`.next/static/chunks/7cb7e46627d0aeb1.js` (28 KB browser chunk, identified by the string
`Questionnaires that collect information relevant`):

| slug | occurrences in the client chunk |
|---|---|
| `basic-information` | 1 |
| `financial-information` | 1 |
| `assets-debts` | 1 |
| `marriage-details` | 4 |
| `children-information` | 4 |
| `parenting-plan` | 4 |
| `income-employment` | 2 |
| `property-division` | 1 |

The pinned petition `sha256` (`46a08e8f…76a4d`) was present too. So **all eight unsupported slugs and
the full 21-row catalog — provenance, bytes, `officialUrl` — did reach the browser bundle.** The DTO
boundary governs the serialized props; it cannot govern the module graph. The existing tests could not
see it: they scan `JSON.stringify(model())` only
(`__tests__/forms/court-forms-questionnaire-links.test.ts`). What kept it unreachable in production was
the 308 redirect, not the DTO.

This is closed by construction in the same change as this document — see §7 Stage 0 — and guarded by
`__tests__/app/court-forms-client-bundle-boundary.test.ts`. The `sha256` / `officialUrl` half of the
same leak is a separate concern and is **not** claimed as remediated here beyond no longer reaching
this chunk.

**No other consumer.** `getFormsForQuestionnaire` is the only other reader of the field and has **zero
call sites anywhere** — not in `app/`, `lib/`, `components/`, `scripts/` or `__tests__/`. No API route
and no PDF generator consults `relatedQuestionnaires`.

---

## 4. Independent evidence that a real mapping exists

Two in-repo sources, neither of which is the catalog.

**A. `OFFICIAL_FIELD_MAP_BINDINGS`** (`lib/forms/field-map-compatibility.ts:96-132`). Each binding names
the ONE questionnaire whose response object the map reads, and is machine-checked against the registry
via `isQuestionnaireId` / `questionnaireHasField` (`:187-215`). Ledger F5 records all 140 fields present
in their owning questionnaire, 0 absent.

| formId | questionnaireId | fields |
|---|---|---|
| `petition-no-children` | `petition` | 11/11 |
| `petition-with-children` | `petition` | 13/13 |
| `summons` | `petition` | 6/6 |
| `financial-affidavit` | `financial_affidavit` | 73/73 |
| `parenting-plan` | `parenting_plan` | 37/37 |

**B. Generation dispatch.** `DOCUMENT_TO_OFFICIAL_FORM` at
`lib/document-generation/official-form-request.ts:22-31` (moved there by `c680cad`; previously in the
route), the official dispatch at `lib/document-generation/official-forms/index.ts:200-213`, and the
summary switch at `app/api/documents/generate/route.ts:193-214`. This records which questionnaire
response object actually feeds which output: `petition` → the petition forms, `financial_affidavit` →
`financial-affidavit`, `parenting_plan` → `parenting-plan`, `marital_settlement` → a
`marital-settlement` summary.

A and B **agree independently** on four form ids. A alone covers `summons`. B alone covers
`marital_settlement`, and does so under the document type `marital-settlement`, which is **not** the
catalog id `marital-settlement-agreement`.

**A third source exists and must not be used.** `/legal-info/document-guide`
(`app/legal-info/document-guide/page.tsx:27-160`) carries its own questionnaire→form map that labels
statewide ATJ artifacts with Cook County `CCP 09xx.xx` numbers and names three form ids absent from the
catalog (`schedule-a`, `schedule-b`, `allocation-judgment`). That is why the route was closed.

---

## 5. Classification

### 5a. The eight slugs, as identifiers

**None is proven. All eight are contradicted as questionnaire identifiers** — established positively,
not by absence alone: `git log --all -S"<slug>" -- lib/questionnaires prisma lib/seed-questionnaires.ts`
returns **zero commits for every one of the eight, across the entire history.** They were never real
ids. `__tests__/questionnaires/questionnaire-registry.test.ts:62-70` asserts each one fails
individually.

What remains is per-slug *intent*, and there the eight differ:

| slug | intent | nearest real thing in the repo |
|---|---|---|
| `basic-information` | **contradicted** | section `basic-info` (`marital_settlement`) and `personal-info` (`petition`) — sections, not questionnaires |
| `financial-information` | **contradicted** | no section either; `financial-accounts`, `financial-division` |
| `assets-debts` | **contradicted** | three separate sections: `real-estate-assets`, `vehicle-assets`, `debts` |
| `marriage-details` | **contradicted** | the only near-match in all history is a *section* id `official-marriage-details` on the unmerged, abandoned branch `codex/fs-form-catalog-20260914` (`db62877`; file since deleted). Intent at section granularity only |
| `children-information` | **unresolved — ambiguous** | two sections titled *exactly* "Children Information": `children` in `petition` and `children-info` in `parenting_plan`. Cannot be resolved to one questionnaire without a ruling |
| `parenting-plan` | **unresolved — ambiguous** | differs from the real `parenting_plan` by a hyphen, **but is simultaneously the catalog form id** `parenting-plan` — and row 13 declares its own id. Decisive evidence the field was written loosely; a hyphen→underscore normalization would manufacture a plausible-looking but unevidenced mapping |
| `income-employment` | **contradicted** | section `employment-income` (`financial_affidavit`) — word order reversed |
| `property-division` | **contradicted, and it collides with a live namespace** | it is a real **legal-content article slug** (`app/api/admin/seed-legal-content/route.ts:45`), served at `/property-division`, with `/legal-info/property-division` redirecting to it. If this field ever became a link, this entry alone would resolve to a working wrong page |

### 5b. The 21 rows, as relationships

| Row | Verdict | Basis | Recommendation |
|---|---|---|---|
| `petition-no-children` | **proven** | A + B agree | `["petition"]` |
| `petition-with-children` | **proven** | A + B agree | `["petition"]` |
| `financial-affidavit` | **proven** | A + B agree | `["financial_affidavit"]` |
| `parenting-plan` | **proven** | A + B agree | `["parenting_plan"]` |
| `summons` | **proven, single-sourced** | A only: `SUMMONS_FIELD_MAP`, 6/6 fields in `petition`. No generator — and `c680cad` records the independent blocker that no summons filler exists at all | `["petition"]` |
| 7× `financial-additional-*` | **unresolved** | the catalog's own description says "Financial Affidavit continuation page only", but `automationStatus:"unmapped"`, no field map, no generator. Plausible by prose; nothing field-level | **retire to `[]`** — Option 2 below |
| `marital-settlement-agreement` | **unresolved** | B generates `marital_settlement` under document type `marital-settlement` ≠ this catalog id; no field map; row is `freshstart_template` / `never_composable` | **retire to `[]`**, flag the id mismatch |
| `judgment-no-children`, `judgment-with-children` | **contradicted / no evidence** | no field map, no generator case. The only source claiming settlement→judgments is the discredited document-guide | **retire to `[]`** |
| `child-support-order` | **no evidence** | no field map, no generator | **retire to `[]`** |
| `income-withholding-order` | **no evidence** | `separately_guarded`; no field map | **retire to `[]`** — unchanged by, and changing nothing about, any IWO gate |
| `appearance`, `certificate-of-service`, `affidavit-service-special-process`, `waiver-service` | already `[]` | — | leave as-is |

**Net:** 5 rows earn an evidence-supported mapping; 16 retire to `[]`; all 8 slugs are deleted.

`marital_settlement` would then appear in **zero** rows despite having a summary generator — an
asymmetry that follows from it having no field map. Recorded rather than papered over.

### The options before the owner

- **Option 1 (recommended).** Adopt the 5 field-map-derived mappings; retire the other 16. Every
  non-empty entry is backed by a machine-checked binding. Nothing is inferred from a string's shape.
- **Option 2 (a separate, additional ruling).** Also set the 7 Financial Affidavit continuation rows to
  `["financial_affidavit"]`, on the strength of the catalog's own "continuation page only" descriptions.
  Defensible under the existing copy, but it is prose evidence, not field evidence, and cannot be
  machine-verified. Kept separate so it can be granted or refused on its own.
- **Option 3.** Retire the field entirely — all 21 rows `[]`, delete the field and
  `getFormsForQuestionnaire`. Safest, and gives up the one true thing the field could say.

**Not recommended under any option:** normalizing `parenting-plan` → `parenting_plan`, or
`children-information` → a section-derived guess. Both are shape-matching, which is the identity-merge
the 2026-09-14 evidence packet exists to prevent.

---

## 6. Risks carried into the ruling

1. **The bundle leak was the real F4 exposure** (§3). Retiring the slugs removes them from the browser
   far more robustly than server-side filtering does — an argument about the ruling itself, not only
   about its tests. Stage 0 closes the module-graph half independently of the ruling.
2. **Live namespace collision.** `property-division` is a real article slug. Any future change that
   turns this field into a link would silently produce a working wrong destination.
3. **Self-reference.** Row `parenting-plan` lists its own id. Treat the field's historical semantics as
   undefined, not as "questionnaire ids with a typo".
4. **Shared-array aliasing at the edit site.** `q.basic` / `q.financial` / `q.assets` are stored **by
   reference** on 4-5 rows each. Any in-place mutation during remediation silently mutates sibling rows
   and the shorthand table. Replace with fresh literals and delete `q`; never `push`/`splice` these.
5. **Two current invariants block forward motion by design.**
   `__tests__/questionnaires/questionnaire-registry.test.ts:62-70` asserts every declared link fails to
   resolve, and `__tests__/forms/court-forms-questionnaire-links.test.ts:50` asserts the raw catalog
   links are non-empty as a non-vacuity guard. Option 1 breaks the first; Option 3 breaks both. The
   ruling necessarily arrives with test edits. That is intended, not a regression.
6. **A vacuous positive path.** Nothing proves `toDto` *preserves* a resolved link:
   `court-forms-questionnaire-links.test.ts:51` (`toEqual([])`) would still pass if `toDto` hardcoded
   `relatedQuestionnaires: []`. Under Option 3 the filter becomes permanently unexercised.
7. **Repository ≠ deployment** (§1 caveat). Every classification here is a statement about this
   repository at `c680cad`.
8. **`/legal-info/document-guide` stays closed regardless.** Reopening it needs an owner/legal copy
   ruling plus correction of its CCP-labelled ATJ artifacts and three nonexistent form ids. Related;
   explicitly not decided here.
9. **Nothing here unpauses anything.** All 21 rows remain non-automation-eligible
   (`AUTOMATION_ELIGIBLE_STATUSES` is empty); `getFormPath` throws for every row; all five field maps
   stay `verifiedAgainstArtifact: null`; the IWO gate and both 308s are untouched.

---

## 7. Follow-up scope

Deliberately two stages, so the first needs no ruling.

### Stage 0 — no ruling required; delivered with this document

1. This packet, as the durable record of the open question.
2. The module-graph fix for §3: `lib/forms/court-forms-presentation.ts`, a leaf holding
   `FORM_CATEGORIES`, `FormCategory`, `UNVERIFIED_CATALOG_VALUE` and `formatCatalogLastUpdated` with no
   catalog rows and no module-level calls. `illinois-court-forms.ts` re-exports all four, so every
   existing importer is unchanged; `court-forms-client.tsx` imports from the leaf instead.
3. `__tests__/app/court-forms-client-bundle-boundary.test.ts` — a source-level guard, because Jest
   resolves both modules identically and cannot see the distinction a bundler sees. Verified to FAIL
   when the client import is pointed back at the catalog, so the guard is not vacuous.

No copy change, no redirect change, no claims change, no catalog row touched.

### Stage 1 — owner approved 2026-09-24; implemented as a separately reviewed candidate

- `lib/forms/illinois-court-forms.ts`: delete `q`; set the 5 evidenced arrays as fresh literals; set the
  other 16 to `[]`. Per risk 4, no in-place mutation.
- Under Option 1/2, tighten the field's doc comment to state what it means — "the questionnaire whose
  response object a bound field map reads" — so the next reader cannot re-add a shape guess.
- `getFormsForQuestionnaire`: delete under Option 3; under Option 1/2 it becomes meaningful for the
  first time and needs its first test. Do not leave it exported and untested.
- Restate the two blocking invariants (risk 5) as the durable pair, non-vacuous under every option:
  (a) every declared link resolves — `resolveQuestionnaireLinks(row).unresolved` is `[]` for all 21
  rows; (b) no row declares a form id or legal-article slug. `petition` is both a legitimate
  questionnaire id and a `FormCategory`, so category-name exclusion would reject a proven mapping.
- Add the missing positive-path test (risk 6): a resolved link survives `toDto` onto the DTO and renders
  through the `length > 0` branch.
- Keep `getUnresolvedQuestionnaireLinkAudit()` and its assertions. Under a clean catalog it returns
  `[]`, and it remains the tripwire for any future unsupported claim.
- Copy check, not a blocker: "Questionnaires that collect information relevant to this form" is
  compatible with an unverified field map. It must **not** become a generation or filing claim.

The approved ruling is Option 1: five field-map-derived mappings, with the other sixteen rows empty.
Option 2 was not adopted. The implementation uses fresh array literals and deletes `q`; it does not
infer any mapping from names, descriptions, categories, or section titles. All automation statuses,
the empty `AUTOMATION_ELIGIBLE_STATUSES`, template-source refusals, the official-generation pause,
the IWO gate, and both redirects remain unchanged. Merge, deployment, and every unpause remain
separate gates.

### Out of scope for both stages

Artifact retrieval, field-map/PDF comparison, generated-output diffing, any unpause of generation,
download, packets or IWO, `/legal-info/document-guide` copy, lifting either 308, the
`sha256`/`officialUrl` half of the bundle exposure, and PR #23's exact-head code review.
