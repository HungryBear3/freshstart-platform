# FreshStart Illinois form-artifact reconciliation

**Review date:** 2026-09-14
**Scope:** `lib/forms/illinois-court-forms.ts`, the repository's retained federal IWO, and the current Illinois Courts divorce / child-support / maintenance suite.
**Disposition:** **HOLD affected automated form generation and filing-readiness claims.** This is an evidence packet, not a release approval or legal conclusion.

## Executive finding

The repository catalog is internally reachable but is not a current, artifact-bound catalog of the Illinois forms it names.

- The official Illinois suite currently identifies the core divorce forms as **Approved 03/2025**, the Financial Affidavit suite as **Approved 06/2025**, and the Order for Support suite as **Approved 09/2025**.
- The local catalog still marks **13 Illinois entries** as `2024 / 2024-01-01`.
- All **20 Illinois entries** point to suite index pages rather than the direct PDF artifact named by the entry.
- The repository contains no corresponding PDFs under `public/forms/`; only `public/forms/README.md` is present. `getFormPath()` nevertheless constructs customer-facing `/forms/<filename>` paths for every non-IWO entry.
- Several local entries are not one-to-one matches for a statewide standardized form. Updating only the year would preserve incorrect identity mappings.
- The retained federal IWO remains internally coherent and byte-pinned, but a fresh ACF retrieval was blocked today by an AWS WAF `HTTP 202` challenge. The earlier exact-byte authority remains evidence of record; today's challenge is not a fresh artifact revalidation.

## Current official artifact evidence

The Illinois Courts suite page was retrieved successfully on 2026-09-14. Direct official PDFs were retrieved for nine representative high-impact forms and visually inspected at page 1. Their printed form codes and revision dates are:

| Local role | Current official artifact | Printed code / revision | SHA-256 |
| --- | --- | --- | --- |
| Petition, no children | Petition for Divorce | ATJ 103.4 (03/25) | `46a08e8fb11ad258dc97f08d32d9a8a5ec1a94054755e0e6f703528792576a4d` |
| Petition, with children | Petition for Divorce with Children | ATJ 105.3 (03/25) | `730927bbbe825ee2fc65287ece4776a9d61826a957dbcea67de8a0e1c89faa76` |
| Summons | Summons (Divorce) | ATJ 113.8 (03/25) | `a5ab81435b670cb5873f1554eaca7ca7dfb7460a471e26e93d73a662db588d99` |
| Appearance | Appearance (Divorce) | ATJ 111.5 (03/25) | `d85df304f4fa41d45c1e2abc629683f1bad141670ec316092c9983dd146b8924` |
| Parenting plan | Parenting Plan | ATJ 108.4 (03/25) | `0a715dc0ae48f7409aab450e4dad73f1483f68b5fad65c5a2af3d483d8cdbc2c` |
| Judgment, no children | Judgment for Dissolution | ATJ 104.4 (03/25) | `0e83e660ac783c82f62e808fae0dc13eebc07da847e8afbd545104c6034a140b` |
| Judgment, with children | Judgment for Dissolution | ATJ 106.2 (03/25) | `9b7980335f317d36623231536a399a8f1693f281def14427c63422161ec4c564` |
| Support order | Order for Support | ATJ 129.5 (09/25) | `dd227345187a6d5cfe7f000a46d8a49362577d794d06649b2858649e25db4c08` |
| Financial affidavit | Financial Affidavit | ATJ 251.5 (06/25) | `210d2994672764d877d14e8a2e34214f40f26b72c833f57f870792de87105d49` |

The rendered pages were legible and showed no corruption or clipping. This review did not approve mappings or generated outputs merely because the official PDFs rendered correctly.

## Catalog identity mismatches

### Direct replacements exist

The local petition, summons, appearance, parenting-plan, two judgment, Financial Affidavit, and support-order entries can be rebound to the direct official PDFs above. Their version metadata must use the printed revision, not a generic year.

### Entries requiring semantic remap, not a date edit

- `allocation-judgment`: the official suite exposes the with-children Judgment and Parenting Plan; no separate statewide standardized artifact with the local identity was found.
- `certificate-of-service`: not a divorce-suite form. Any supported use must be mapped to the appropriate statewide Proof of Delivery artifact or explicitly identified as another authority.
- `affidavit-service-special-process`: no statewide divorce-suite artifact with this name was found.
- `waiver-service`: no statewide divorce-suite waiver artifact was found. The suite publishes separate Certification Agreements for the with-children and no-children agreed paths.
- `marital-settlement-agreement`: no statewide standardized Illinois Courts PDF with this identity was found. It must be identified as a FreshStart template if retained, never as an official Illinois Courts artifact.
- `schedule-a-child-support` through `schedule-f-retirement`: these names do not match the current Financial Affidavit attachments. The official suite separately publishes Additional My Child Support, Health Insurance, Debts, Cash and Cash Equivalents, Investment Accounts and Securities, Property and Business Interests, and Insurance and Retirement artifacts. One local row cannot silently stand in for multiple official artifacts.
- `child-support-order`: should identify **Order for Support (Child Support and Maintenance), ATJ 129.5 (09/25)** rather than a generic 2024 child-support order.

## Federal IWO status

Repository artifact:

- path: `private/official-forms/income-withholding-order.pdf`
- SHA-256: `2b15c02a46b66a7d0fa2bd80d4644d5d6d5e6798911225f8e0272b45fe20b551`
- bytes: 505,412
- pages: 4
- AcroForm fields: 112
- printed control/date: OMB 0970-0154 / 08/31/2026

Those facts match the prior pinned evidence. On 2026-09-14, both the queryless ACF URL and `?download=1` path returned `HTTP 202`, `x-amzn-waf-action: challenge`, and zero PDF bytes. That does not negate the earlier exact match; it means today's run cannot claim fresh ACF byte continuity.

The standing transition interpretation remains unchanged: OIRA approved the collection through 2029, the revised successor is not yet a final fillable ACF PDF in the retained evidence, and FreshStart uses the conservative 2027-08-25 legacy transition cutoff. County/case authorization remains separate from artifact currentness.

## Release disposition

Do not patch catalog dates alone. A safe implementation must:

1. Bind every official entry to a direct artifact URL, printed form code/revision, retrieval timestamp, content type, byte length, and SHA-256.
2. Split local templates, county forms, and official statewide forms into distinct authorities.
3. Replace the six invented schedule identities with exact official attachment identities and determine whether the questionnaire/field mapping supports each artifact.
4. Re-run field-map and generated-output diffs against the exact current PDFs before any affected lane is enabled.
5. Keep the IWO behind its existing artifact, policy, county, and per-case authorization gates; do not treat OMB renewal alone as packet authority.
6. Keep customer downloads and filing-readiness claims fail-closed until an independently reviewed candidate passes the complete artifact and mapping checks.

## Official sources

- Illinois Courts, Divorce / Child Support / Maintenance suite: <https://www.illinoiscourts.gov/documents-and-forms/approved-forms/circuit-court-standardized-forms-suites/divorce-child-support-maintenance/>
- Federal IWO canonical endpoint: <https://www.acf.hhs.gov/sites/default/files/documents/ocse/omb_0970_0154.pdf>
- Existing transition evidence: `docs/legal-audit/iwo-omb-renewal-transition-2026-09-01.md`

## Actions not performed

No catalog/code changes, form substitution, customer download, document generation, filing action, payment action, deployment, production mutation, or external contact occurred.
