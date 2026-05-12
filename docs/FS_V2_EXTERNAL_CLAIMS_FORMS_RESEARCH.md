# FreshStart External Claims + Forms Research Report

Date accessed: 2026-05-11
Prepared by: Opus research pass, captured by Rex
Scope: External public-source research for FreshStart-IL v2 production readiness. No production deploy or live side-effect calls.

## Executive Verdict

- **Forms catalog is stale.** Official Illinois divorce/child support/financial-affidavit forms were re-approved `03/2025` and `06/2025`; `lib/forms/illinois-court-forms.ts` still carries `lastUpdated: '2024-01-01'` for the divorce suite. The catalog also still uses pre-2025 names, points many divorce-suite forms at the suite index URL rather than actual blob PDFs, and lists several forms that are not in the official divorce suite.
- **`$15,000-$25,000` contested-attorney claim is supportable with qualifier.** Multiple Illinois practitioner sources put contested IL divorces at `$10k-$30k+` per spouse; `$15,000-$25,000` sits inside the consensus range. Safe with a `contested` qualifier and citation. Not safe as a blanket `Illinois divorce` range because uncontested is much lower.
- **Time-to-complete claim should stay qualitative.** Public industry sources describe online questionnaire/interview time as `one to two hours`, but not through audited studies. Keep `one focused session when their information is ready`; do not restore `under 2 hours`, `average X minutes`, or `80% in one sitting` without internal cohort evidence.
- **102-county claim splits cleanly.** Illinois has exactly 102 counties. `Available in all 102 Illinois counties` is defensible if the product accepts IL users statewide and produces statewide-approved forms. `County-specific filing instructions for all 102 counties` is not defensible today; repo detailed county records cover only a small subset.

## Source Table

### Illinois statewide forms — divorce/child support/maintenance
- Source: Illinois Courts official
- URL: https://www.illinoiscourts.gov/documents-and-forms/approved-forms/circuit-court-standardized-forms-suites/divorce-child-support-maintenance/
- Date accessed: 2026-05-11
- Relevance: Authoritative source page for divorce-suite forms
- Strength: Strong / primary source

### Illinois statewide forms — financial affidavit
- Source: Illinois Courts official
- URL: https://www.illinoiscourts.gov/documents-and-forms/approved-forms/circuit-court-standardized-forms-suites/financial-affidavit/
- Date accessed: 2026-05-11
- Relevance: Authoritative source page; suite approved 06/2025
- Strength: Strong / primary source

### Illinois statewide forms — fee waiver civil
- Source: Illinois Courts official
- URL: https://www.illinoiscourts.gov/documents-and-forms/approved-forms/circuit-court-standardized-forms-suites/fee-waiver-civil/
- Date accessed: 2026-05-11
- Relevance: Authoritative source page for FW-CIV Application/Order
- Strength: Strong / primary source

### Illinois statewide forms — proof of delivery
- Source: Illinois Courts official
- URL: https://www.illinoiscourts.gov/documents-and-forms/approved-forms/circuit-court-standardized-forms-suites/proof-of-delivery/
- Date accessed: 2026-05-11
- Relevance: Where proof-of-service-style statewide forms live in IL
- Strength: Strong / primary source

### Contested IL divorce cost ranges
- Sterling Lawyers: https://www.sterlinglawyers.com/illinois/divorce/cost/
- Vantage Group Legal: https://vantagegl.com/articles/family-law/average-cost-divorce-illinois/
- O'Flaherty Law: https://www.oflaherty-law.com/learn-about-law/how-much-does-a-divorce-cost-in-illinois
- Lawyers.com: https://legal-info.lawyers.com/family-law/divorce/how-much-does-divorce-cost-in-illinois.html
- Date accessed: 2026-05-11
- Relevance: IL-specific practitioner/publisher cost ranges; supports contested-case qualifier
- Strength: Medium

### Online divorce timing
- Online Illinois Divorce: https://onlineillinoisdivorce.com/
- DivorceWriter: https://www.divorcewriter.com/online-divorce/Illinois
- Date accessed: 2026-05-11
- Relevance: Vendor self-report for questionnaire/interview timing
- Strength: Weak; not audited

### Illinois county count
- Source: U.S. Census / county references; Wikipedia used as quick list reference
- URL: https://en.wikipedia.org/wiki/List_of_counties_in_Illinois
- Date accessed: 2026-05-11
- Relevance: Illinois has 102 counties
- Strength: Strong for count, but prefer official/state source in final citation if available

## Recommended Public Copy

### Attorney cost framing
Use only with contested qualifier:

> Contested Illinois divorces commonly run `$15,000-$25,000+` per spouse in attorney fees.

Optional footnote:

> Range reflects Illinois family-law practitioner estimates for contested cases; see Sterling Lawyers, Vantage Group Legal, and O'Flaherty Law. Uncontested cases are typically far lower.

### Time to complete
Keep qualitative:

> Most filers move through FreshStart in one focused session when their information is ready.

Do not restore numeric timing without internal telemetry.

### All 102 counties
Safe:

> Available in all 102 Illinois counties.

Potentially safe after catalog refresh:

> Generates Illinois Supreme Court statewide-approved forms used across Illinois Circuit Courts.

Not safe today:

> County-specific filing instructions for all 102 counties.

### ILCS review
Do not restore `Reviewed against Illinois Compiled Statutes`. Keep:

> Built around Illinois court forms and filing steps.

## Blockers Before Stronger Copy

1. Refresh form catalog against official Illinois Courts 2025 URLs/version dates.
2. Backfill 102 county-specific records if we want county-specific instructions for all counties; otherwise keep availability-only copy.
3. Keep attorney-cost claim contested-scoped; do not use as blanket divorce-cost claim.
4. Keep completion-time copy qualitative until internal telemetry exists.
5. Produce dated ILCS/court-form audit artifact before stronger `Reviewed against...` language.

## Exact Form-Catalog Mismatches for Claude Code

Target file: `lib/forms/illinois-court-forms.ts`

### A. Version/date updates

- Divorce/parenting/judgment/summons/appearance forms in current official suite: `version: '2025-03'`, `lastUpdated: '2025-03-01'`.
- Financial Affidavit suite: `version: '2025-06'`, `lastUpdated: '2025-06-01'` where applicable.
- Child-support/support order suite: `version: '2025-09'`, `lastUpdated: '2025-09-01'` where applicable.

### B. Replace generic suite-index URLs with direct official PDF URLs

- `petition-no-children` → Petition for Divorce / DNC Petition: https://ilcourtsaudio.blob.core.windows.net/antilles-resources/resources/f41da79e-f087-483e-9dd8-d71d2739d231/DNC%20Petition.pdf
- `petition-with-children` → Petition for Divorce with Children / DWC Petition: https://ilcourtsaudio.blob.core.windows.net/antilles-resources/resources/29fc2ee4-ddda-47f4-af12-f3f4d38f6a70/DWC%20Petition.pdf
- `summons` → Divorce Summons / DIV Summons: https://ilcourtsaudio.blob.core.windows.net/antilles-resources/resources/2b052cc8-5066-4ffb-a678-e17edd400ef6/DIV%20Summons.pdf
- `appearance` → Divorce Appearance / military notice: https://ilcourtsaudio.blob.core.windows.net/antilles-resources/resources/ea73b648-a088-4ca8-81cd-b8bc00c7da37/DIV%20Divorce%20Entry%20of%20Appearance%20Military%20Notice.pdf
- `parenting-plan` → DWC Parenting Plan: https://ilcourtsaudio.blob.core.windows.net/antilles-resources/resources/a601856a-12e7-44fe-9076-88a8e150c3a7/DWC%20Parenting%20Plan.pdf
- `allocation-judgment` → DWC Judgment; no separate statewide allocation-judgment form: https://ilcourtsaudio.blob.core.windows.net/antilles-resources/resources/28a17a49-16ea-415f-9642-6c186e387d94/DWC%20Judgment%20for%20Dissolution.pdf
- `judgment-no-children` → DNC Judgment: https://ilcourtsaudio.blob.core.windows.net/antilles-resources/resources/ee611252-2582-4546-9426-72234f6582af/DNC%20Judgment%20for%20Dissolution.pdf
- `judgment-with-children` → DWC Judgment: https://ilcourtsaudio.blob.core.windows.net/antilles-resources/resources/28a17a49-16ea-415f-9642-6c186e387d94/DWC%20Judgment%20for%20Dissolution.pdf
- `child-support-order` → DCS Order For Support, Approved 09/2025: https://ilcourtsaudio.blob.core.windows.net/antilles-resources/resources/e3440546-6e6b-4904-9cab-2b029894c518/DCS%20Order%20For%20Support.pdf
- `income-withholding-order` → federal OMB form: https://www.acf.hhs.gov/sites/default/files/documents/ocse/omb_0970_0154.pdf
- `financial-affidavit` → Financial Affidavit family/divorce cases, Approved 06/2025: https://ilcourtsaudio.blob.core.windows.net/antilles-resources/resources/2cb2c0ce-20f8-4eb5-9d23-05664d7f4404/FA%20Financial%20Affidavit.pdf

### C. Forms that do not belong as official divorce-suite forms

- `certificate-of-service`: no certificate-of-service form in divorce suite. Closest statewide source is Proof of Delivery suite. Move/relabel or point to proof-of-delivery suite.
- `affidavit-service-special-process`: no statewide standardized divorce-suite form by this name. If county template, mark as `source: 'county-template'` or remove from statewide catalog.
- `waiver-service`: no statewide waiver-of-service form in divorce suite. Consider DNC/DWC Certification Agreement instead if product flow is joint/agreed path.
  - DNC Certification Agreement: https://ilcourtsaudio.blob.core.windows.net/antilles-resources/resources/e7e13118-e078-439d-b66e-78d5b9166152/DNC%20Certification%20Agreement.pdf
  - DWC Certification Agreement: https://ilcourtsaudio.blob.core.windows.net/antilles-resources/resources/e0f89e73-f131-4aa2-9e3c-1c1c1428b6b1/DWC%20Certification%20Agreement.pdf
- `marital-settlement-agreement`: not a statewide standardized court PDF. Relabel as `freshstart-template` and remove official IL Courts URL, or remove from official catalog.

### D. Financial schedules A-F need remap

- `schedule-a-child-support`: Additional My Child Support.
- `schedule-b-health-insurance`: Additional Health Insurance.
- `schedule-c-debts`: Additional My Debts.
- `schedule-d-accounts`: Financial Affidavit splits cash/equivalents and investment accounts/securities.
- `schedule-e-business`: Additional Business Interests and possibly Additional My Employment/Business.
- `schedule-f-retirement`: Additional Insurance and Retirement / life insurance policies.

Claude should verify exact PDF URLs from official source before writing them.

### E. New forms to consider adding

- `dwc-additional-children-petition`
- `dwc-other-information-petition`
- `dwc-additional-parenting-time`
- `div-additional-debts-liabilities`
- `div-additional-personal-property`
- `div-letter-to-sheriff-summons`
- `div-motion-for-default`
- `div-order-for-default`
- `idph-certificate-dissolution`
- `dcs-support-information-sheet`
- `dcs-letter-to-employer-withholding`
- `daf-interim-fee-award-order`
- Answer/Response suite if respondent-side workflow is in scope.

### F. Header comment fix

Update source URL in `lib/forms/illinois-court-forms.ts` line 5 to:

https://www.illinoiscourts.gov/documents-and-forms/approved-forms/circuit-court-standardized-forms-suites/divorce-child-support-maintenance/
