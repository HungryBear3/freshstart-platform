# FreshStart-IL — ILCS + Quantified Claims Audit

Date: 2026-05-11
Source: Opus audit report requested by Alexy.
Scope: Local repo evidence only. No production deploy, no live API calls, no secrets review.

## Executive verdict

- `Reviewed against Illinois Compiled Statutes`: **not substantiated** as public marketing copy. Product has ILCS/form evidence, but no dated review artifact.
- `Built for all 102 Illinois counties`: **partially substantiated**. Defensible as availability/coverage only; not defensible as per-county filing instructions for every county.
- `$15,000-$25,000` attorney cost: **partially substantiated** for contested attorney-led cases. Needs contested qualifier or external citation.
- `under 2 hours`: **partially substantiated** as qualitative one-session framing. No app telemetry proves the hard time claim.
- `80% complete in one sitting`: **not substantiated**; keep removed.
- `1 in 12 refile rate`: **not substantiated**; keep removed.

## A. ILCS / court-form source audit

### Existing dated artifact

None found.

No file matching `*review*audit*`, `*ilcs*audit*`, `*statutes*audit*`, or `*compliance*` exists in the repo. There is no dated/signed `Reviewed against Illinois Compiled Statutes` artifact.

### Evidence product was built around IL law/forms

Strongest local evidence:

- `lib/forms/illinois-court-forms.ts` lines 1-447
  - cites `illinoiscourts.gov` standardized forms
  - catalogs 18 forms across petition, financial, parenting, service, judgment, support
  - each entry carries `officialUrl`, `version: '2024'`, `lastUpdated: '2024-01-01'`
- `lib/financial/calculators/child-support.ts`
  - explicitly based on Illinois Child Support Guidelines, `750 ILCS 5/505`
  - encodes 2024 basic support obligation table
- `lib/financial/calculators/spousal-maintenance.ts`
  - explicitly based on Illinois Spousal Maintenance Guidelines, `750 ILCS 5/504`
  - encodes 2019 statutory guidelines and $500k income limit
- `lib/case/deadline-calculator.ts` lines 13-15
  - based on Illinois Compiled Statutes and court rules
  - includes 30-day response, 60-day financial disclosure, 28-day discovery
- `app/dashboard/financial/child-support/page.tsx` line 313
  - surfaces `750 ILCS 5/505`
- `app/dashboard/financial/spousal-maintenance/page.tsx` line 247
  - surfaces `750 ILCS 5/504`
- `app/calculators/page.tsx` lines 60, 92
  - calculator cards labeled Illinois Guidelines, `750 ILCS 5/505`, `750 ILCS 5/504`
- `lib/seed-legal-content.ts`
  - seeds substantive IL divorce-law articles: grounds, property division, child custody, spousal maintenance, prenup, residency
- `app/legal-info/court-forms/page.tsx` lines 142, 289
  - surfaces Illinois Supreme Court approved standardized forms and links to `illinoiscourts.gov`
- `app/legal-info/court-resources/page.tsx` lines 74, 200
  - surfaces ILCS reference and links to ILCS, e-filing, circuit court resources
- `components/legal/disclaimer.tsx` lines 167, 219
  - refers to Illinois Supreme Court approved standardized forms and per-county clerk variations
- `content/blog/illinois-parenting-plan-guide.md` line 14
  - cites `750 ILCS 5/602.10`

### Gaps

- `lib/seed-legal-content.ts` legal articles do not cite ILCS section numbers inside article bodies.
- Form catalog hardcodes `version: '2024'` and `lastUpdated: '2024-01-01'` for every form; no programmatic verification against current `illinoiscourts.gov` form versions.
- No dated reviewer signature on any audit doc.
- Schedule A-F financial disclosure form names in `lib/forms/illinois-court-forms.ts` should be verified against current Illinois court schedule labeling.

### Public wording recommendation

Keep:

- `Built around Illinois court forms and filing steps`

Do not restore:

- `Reviewed against Illinois Compiled Statutes`

Unless we produce a dated artifact listing every form, calculator, deadline, and legal article with ILCS/form mappings, reviewer, date, scope, and unsupported edge cases.

## B. County coverage audit

### County list evidence

The repo has duplicate county lists:

- `lib/counties/illinois-counties.ts: ALL_ILLINOIS_COUNTIES`
  - regex extraction found 98 names, file comment says full 102
- `lib/calculators/constants.ts: ILLINOIS_COUNTIES`
  - regex extraction found 99
- `components/efiling/county-instructions.tsx: ILLINOIS_COUNTIES`
  - regex extraction found 98

Manual recount may close gaps caused by multi-word names like De Witt, Jo Daviess, St. Clair, but no list demonstrably proves all 102 via automated audit.

### County-specific behavior

- `lib/counties/illinois-counties.ts: ILLINOIS_COUNTIES: Record<string, CountyInfo>`
  - 12 detailed county records: Cook, DuPage, Lake, Will, Kane, McHenry, Winnebago, Madison, St. Clair, Sangamon, Peoria, Champaign
- `components/efiling/county-instructions.tsx: SAMPLE_COUNTY_DATA`
  - 4 detailed counties: Cook, DuPage, Lake, Will
- Default fallback for all others:
  - `DEFAULT_COUNTY_FEES = { petitionFiling: 337, responseFiling: 337, feeWaiverAvailable: true }`

The 12 detailed records cover populous counties. Roughly 90 rural counties get generic/default data, not true per-county filing instructions.

### Public wording recommendation

Defensible now:

- `Available in all 102 Illinois counties`

Not defensible today:

- `County-specific filing instructions for all 102 counties`

Better after small backfill:

- `County-specific filing instructions for Cook, DuPage, Lake, Will, and Kane; statewide guidance for all 102 Illinois counties.`

## C. Quantified claims audit

### `$15,000-$25,000` attorney cost

Verdict: partially substantiated.

Repo evidence supports this mainly as a contested-case range:

- `content/blog/illinois-divorce-cost-breakdown.md` lines 7-9
  - contested divorce: `$5,000-$30,000+`
  - uncontested divorce: `$300-$2,000 total`
- `content/blog/illinois-divorce-cost-breakdown.md` line 32
  - full representation contested: `$5,000-$25,000+`
- `content/blog/illinois-divorce-without-lawyer.md` line 8
  - attorney in Illinois costs `$10,000-$25,000 per spouse` for a contested case
- `app/api/drip/send/route.ts` lines 30-31
  - softened drip copy: `$250-$400/hr`, often `$5,000-$15,000+ total`

Recommendation:

- Add a contested qualifier when showing `$15,000-$25,000`.
- Or add an external citation if using the range more broadly.

### `under 2 hours`

Verdict: partially substantiated.

No telemetry proves the hard time claim. Current safer wording should avoid the exact two-hour promise unless data exists.

Recommendation:

- Use: `Straightforward uncontested cases can often complete a first draft in one focused session when their information is ready.`

### `80% complete in one sitting`

Verdict: not substantiated.

Keep removed unless analytics later produce evidence.

### `1 in 12 refile rate`

Verdict: not substantiated.

Keep removed unless rejection/refile telemetry later produces evidence.

## D. Production blockers from this audit

1. Dated ILCS/court-form audit artifact if we want stronger `Reviewed against...` copy.
2. County data backfill or keep all-102 claim as availability only.
3. Remove exact hard `under 2 hours` claim from Hero.
4. Add contested qualifier to `$15,000-$25,000` attorney-cost display or cite externally.
5. Do not restore `80%` or `1 in 12` claims until telemetry exists.

## E. Applied copy direction

Production-safe direction after this audit:

- `Available in all 102 Illinois counties`
- `Built around Illinois court forms and filing steps`
- `Contested Illinois divorces can cost $15,000-$25,000+ in attorney fees`
- `Straightforward uncontested cases can often complete a first draft in one focused session when their information is ready`
- no `80%`
- no `1 in 12`
