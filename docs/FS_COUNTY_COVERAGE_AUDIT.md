# FreshStart-IL — County Coverage Audit

Date: 2026-05-11
Scope: Local repo evidence only. No external API or scrape. No staging/commit.
Related: `docs/FS_V2_ILCS_CLAIMS_AUDIT.md`, `docs/FS_V2_LEGAL_COPY_REVIEW.md`.

## TL;DR

- Yes — two of the three in-repo county lists demonstrably hit all 102 Illinois counties (`ALL_ILLINOIS_COUNTIES` in `lib/counties/illinois-counties.ts` and `ILLINOIS_COUNTIES` in `lib/calculators/constants.ts`). One list — the e-filing dropdown — is short by **one county (Ford)**.
- Recommendation: keep the `Available in all 102 Illinois counties` claim as an availability-only statement, fix the one missing entry in the e-filing dropdown (or have it import the canonical list), and do not promise per-county filing instructions for every county — the detailed `Record<string, CountyInfo>` has data for **12 / 102** counties.

## Per-list counts

Counts derived by reading each file with the Read tool and parsing the literal with a Node script that respects quoted strings (multi-word names like `Jo Daviess`, `Rock Island`, `St. Clair` were not split). Uniqueness was checked case-insensitively. The canonical baseline is the 102 Illinois counties (general knowledge).

| ID | File | Line | Variable | Shape | Count | All 102? |
| --- | --- | --- | --- | --- | --- | --- |
| A | `lib/counties/illinois-counties.ts` | 415 | `ALL_ILLINOIS_COUNTIES` | `string[]` | **102** | Yes |
| B | `lib/calculators/constants.ts` | 6 | `ILLINOIS_COUNTIES` | `string[]` (sorted) | **102** | Yes |
| C | `components/efiling/county-instructions.tsx` | 10 | `ILLINOIS_COUNTIES` | `string[]` | **101** | No — missing `Ford` |
| D | `lib/counties/illinois-counties.ts` | 47 | `ILLINOIS_COUNTIES` | `Record<string, CountyInfo>` | **12** | N/A — explicitly "major counties" |
| E | `components/efiling/county-instructions.tsx` | 115 | `SAMPLE_COUNTY_DATA` | `Record<string, any>` | **4** | N/A — sample only (Cook, DuPage, Lake, Will) |

No other county-name lists were found in the repo. A broader grep for `ILLINOIS_COUNTIES|ALL_ILLINOIS_COUNTIES|illinois_counties` returned hits only in `lib/counties/illinois-counties.ts`, `lib/calculators/constants.ts`, `components/efiling/county-instructions.tsx`, plus consumer call-sites (`lib/calculators/timeline.ts`, `lib/calculators/constants.ts`, `app/legal-info/timeline-calculator/page.tsx`, `app/legal-info/cost-estimator/page.tsx`, and `docs/FS_V2_ILCS_CLAIMS_AUDIT.md`). The first canonical-shaped sequence `Adams.*Alexander.*Bond` appears in only one file — `lib/counties/illinois-counties.ts`.

## Diff matrix (vs canonical 102; names normalized — spaces stripped, periods removed, lowercased)

| Pair | In first not in second | In second not in first |
| --- | --- | --- |
| A vs canonical | none | none |
| B vs canonical | none | none |
| C vs canonical | none | `Ford` |
| A vs B | none | none |
| A vs C | `Ford` | none |
| B vs C | `Ford` | none |

So A and B are identical as sets. C is A \\ `{Ford}`.

Naming convention differences between A and B (these normalize to the same county but are spelled differently in source):

- A spells the 20th county as `'De Witt'` (with space). B and C spell it as `"DeWitt"` (no space).
- All three agree on `Jo Daviess`, `Rock Island`, `St. Clair`, `LaSalle`, `DuPage`, `DeKalb`, `McDonough`, `McHenry`, `McLean`.

If we ever map county names back to per-county records by string equality, the `De Witt` vs `DeWitt` split will silently drop matches — worth normalizing.

## Detailed-county counts

`lib/counties/illinois-counties.ts` defines a typed `Record<string, CountyInfo>` (filing fees, court address, e-filing portal/URL, parenting class, judicial circuit) for **12 / 102 counties**:

`cook, dupage, lake, will, kane, mchenry, winnebago, madison, stclair, sangamon, peoria, champaign`

The remaining 90 counties fall through to `DEFAULT_COUNTY_FEES` (`$337` petition / `$337` response / fee waiver available) and a generic "contact your local circuit court clerk" string via `getCountyInstructions`.

`components/efiling/county-instructions.tsx` carries a separate `SAMPLE_COUNTY_DATA` record for **4 / 102 counties**: `Cook, DuPage, Lake, Will`. Counties not in this record render a hard-coded fallback ("This county accepts e-filing through Illinois E-Services. Check with the clerk's office..."). The file comment explicitly labels this "Sample county data - in production, this would come from the database."

So the honest per-county-data answer is: 12 counties with structured filing-fee/court data, 4 counties with e-filing instruction copy. Not 102.

## Canonical list recommendation

Source of truth should be `lib/counties/illinois-counties.ts` line 415: **`ALL_ILLINOIS_COUNTIES`**.

Why:

- It is already documented as `/** Full list of all 102 counties */`.
- It lives in `lib/counties/`, the natural namespace for county data — the calculator constants file and the e-filing component should be importing, not redeclaring.
- It is parallel to the `ILLINOIS_COUNTIES` record in the same file, so a future per-county-data feature can cross-reference both lists from one module.

Caveat: A uses `'De Witt'` (with space) while B and C use `"DeWitt"`. If we promote A as canonical without normalizing, the two existing call-sites would change behavior (alphabetic sort order, dropdown label, route slug). To avoid that diff, the new shared helper this audit ships (`lib/counties/all-counties.ts`) uses the `DeKalb`/`DeWitt` no-space convention to match the spellings already rendered in B and C — i.e. the user-visible spellings stay stable.

## Public copy recommendation

- Keep `Available in all 102 Illinois counties` (or `Built for all 102 Illinois counties`) as an **availability-only** claim. It is defensible: two independent in-repo lists demonstrably enumerate the full 102.
- Do **not** use copy that implies per-county filing instructions, per-county fee tables, or per-county e-filing portals are present for every county. That is currently true for ~12 counties, not 102.
- If the e-filing dropdown is rendered to users on production, fix the missing `Ford` entry (101 → 102) before launch, or have the dropdown import from `lib/counties/all-counties.ts`.

## Helper + test created

Created (new files only — no existing list was modified):

- `lib/counties/all-counties.ts` — exports `ALL_ILLINOIS_COUNTIES: readonly string[]` (length 102) and `ILLINOIS_COUNTY_COUNT = 102`. Comments document the multi-word / punctuated-name conventions and that detailed per-county data lives in `lib/counties/illinois-counties.ts`.
- `__tests__/lib/counties/all-counties.test.ts` — asserts `length === 102`, no duplicates (case-insensitive), preserves multi-word/punctuated names (`Jo Daviess`, `Rock Island`, `St. Clair`, `DeKalb`, `DeWitt`, `DuPage`, `LaSalle`), includes the top-10 by population, and all entries are non-empty trimmed strings.

Verified passing locally (`npx jest __tests__/lib/counties/all-counties.test.ts`): 5 / 5 green.

Not changed: the three existing lists (A, B, C) and the two detailed records (D, E). Migrating call-sites to import from `all-counties.ts` is a follow-up — out of scope for this audit.

## Open questions for Alexy

1. **Most important**: Is the e-filing dropdown in `components/efiling/county-instructions.tsx` actually shipped on a user-facing route in v2, or is it still gated? If it ships, the missing `Ford` entry is a literal contradiction of the "all 102 counties" marketing claim and should be fixed before promotion.
2. Do we want to keep two spellings (`De Witt` in A vs `DeWitt` in B/C) or normalize? Recommend `DeWitt` for parity with what users already see in the calculator dropdown and the e-filing component.
3. Should the 12-county detailed-data record be expanded in this milestone, or is the availability-only public copy enough until we have a real per-county data source?
4. Should we open a follow-up task to migrate `lib/calculators/constants.ts` and `components/efiling/county-instructions.tsx` to import from the new `lib/counties/all-counties.ts` (and delete their local copies)? Low risk, would prevent future drift.
