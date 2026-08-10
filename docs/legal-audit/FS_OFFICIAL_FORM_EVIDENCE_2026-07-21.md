# FreshStart official-form evidence & mapping pass — 2026-07-21

Scope: branch-only engineering evidence for the official-PDF mapping layer. No
deploy, launch-status change, or app/pricing/checkout mutation. County-packet
launch remains **HOLD**. Companion machine-readable evidence:
`docs/legal-audit/official-pdf-field-mapping-coverage-2026-07-21.json` (+
`-launch-readiness-slice.json`) and `docs/legal-audit/iwo-federal-provenance-2026-07-21.json`.

## Form revision pinning (verified via pdftotext against the downloaded PDFs)

| Form (repo key) | Local file | Printed code | Revision | Superseded? |
|---|---|---|---|---|
| petition-no-children | petition-dissolution-no-children.pdf | ATJ 103.4 | 03/25 | no |
| petition-with-children | petition-dissolution-with-children.pdf | ATJ 105.3 | 03/25 | no |
| financial-affidavit | financial-affidavit.pdf | ATJ 251.5 | 06/25 | no |
| summons | summons-dissolution.pdf | ATJ 113.8 | 03/25 | no |
| parenting-plan | parenting-plan.pdf | ATJ 108.4 | 03/25 | no |

All five are current 2025 ATJ codes; no retired DV-* mappings remain. 38 active
mappings, 0 broken → mappingIntegrity **PASS** (independent of launchReadiness).

## Health-insurance mis-anchor — corrected

The prior reason ("health insurance is structured **section 13**") was a
field-name-prefix mis-anchor. Verified against **Financial Affidavit ATJ 251.5
(06/25)**: health insurance is printed **§9e "Health Insurance Expenses"**
(printed instruction: *"List any money deducted for health insurance in Section
9e"*). The AcroForm field **names** merely carry an internal `"13 - "` prefix
(e.g. `13 - Monthly Insurance Amount`); the printed §13 is not health insurance.
Companion order-side authority: **Order for Support ATJ 129.5 §E "Health
Insurance."** No conflation with the repo's separate `schedule-b-health-insurance.pdf`.

**Still UNSUPPORTED** (blocker class `source-data-not-structured`): the
questionnaire supplies only a single monthly `health-insurance` number; §9e needs
structured data it does not collect — "I have health insurance: Yes/No,"
carrier, type (Medical/Dental/Orthodontic/Vision), policy (HMO/PPO/Other),
provided-through, payer, and a separate "Monthly Insurance Amount for covering
children." Do not write a bare number into a structured field.

## Parenting schedule — preserved correctly

**Parenting Plan ATJ 108.4 (03/25) §7 "PARENTING TIME SCHEDULE"** is a free-form
Week 1 / Week 2 fill-in time grid (AcroForm cells `8a..21g`), **not** coded
weekday/weekend/alternating checkboxes. Activating `schedule-type` would require
a deterministic product-enum→grid-cell rendering transform that does not exist in
scope. Kept UNSUPPORTED; product enums are **not** mapped to nonexistent
checkboxes (verifier confirms zero broken parenting-plan targets).

## Federal Income Withholding for Support (IWO) — retrieved & verified

Federal **OMB 0970-0154**, not an AOIC/ATJ form and not HFS 3683. Retrieved from
the Illinois-Courts-designated canonical URL and verified before placement:

- SHA-256 `2b15c02a46b66a7d0fa2bd80d4644d5d6d5e6798911225f8e0272b45fe20b551`, 505412 bytes, `%PDF-1.6`, 112 AcroForm fields.
- Title "INCOME WITHHOLDING FOR SUPPORT", "OMB 0970-0154", "Expiration Date: 08/31/2026".
- Zero HFS 3683 / R-8-09 / 10-31-2010 markers (stale variant excluded).
- Placed as `public/forms/income-withholding-order.pdf`; provenance pinned in `IWO_PROVENANCE` (a file that does not byte-match the pinned SHA can never clear the gate).

Modeled as a **federal-omb** provenance class keyed by OMB number + expiration
with deterministic renewal/expiry monitoring. Illinois field-semantics companion:
**DV-WI 130.3 (03/23)**.

## Launch-readiness — still HOLD (independent of mappingIntegrity)

`launchReadiness = READY` requires ALL of: broken=0, unsupported=0, all required
forms present, IWO present + provenance-valid + not expired, OMB renewal resolved,
and county packet-composition + e-filing confirmed by an official county source.
Current standing blockers:

- `unsupported_required_gaps:29`
- `federal_iwo:omb_renewal_review_pending` — federal OMB renewal in progress (exp 08/31/2026; ~41 days at generation).
- `omb_renewal_review:pending`
- `county_packet_composition:unconfirmed` — **no official county source captured**; do not assume.
- `county_efiling_treatment:unconfirmed` — statewide guidance says the IWO is served on the employer and *"Do not file this form with the Circuit Clerk"* (ATJ 127.3), but county e-filing treatment is **not** confirmed.

No county confirmation is claimed; county-specific IWO composition and e-filing
remain open blockers requiring an official county source.
