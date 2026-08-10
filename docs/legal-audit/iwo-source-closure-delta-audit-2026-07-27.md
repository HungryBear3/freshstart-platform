# FreshStart IL — Audit Addendum: IWO Source-Closure Delta + QA Result

**Date:** 2026-07-27 · **Type:** evidence-record addendum only. No code, form mapping, verifier logic, gate state, pricing, or public copy was changed by this addendum or its commit.

## 1. Artifact under audit

- Bundle: `illinois-divorce-county-baseline-20260727-next` (IWO source-closure delta)
- ZIP SHA-256: `54419af488f248d288dcdcd13a501bd63133c35416db6e3c0e320509bb22e030` (verified against the pinned value before review)
- Contents: `federal-omb-iwo.md` (12 rows), `lake-will-iwo.md` (13 rows), `cook-dupage-kane-iwo.md` (19 rows), `INDEX.md`, `manifest.json` — all four manifest pins re-hashed and matched; totals 44 rows / 514 lines / 74,330 bytes recomputed and matched.
- Predecessor baseline: `illinois-divorce-county-baseline-20260727` ZIP `522542d8…268fb`, which passed final QA earlier on 2026-07-27 (PASS_WITH_ADVISORIES). The delta bundle states, and this audit accepts, that the frozen baseline was not modified.

## 2. Independent QA result (Fable delta review, 2026-07-27 ~19:50–20:10 UTC)

**Result: PASS_WITH_ADVISORIES.** Independently re-verified on a separate retrieval channel:

| Claim | Verification |
|---|---|
| Cook `CCDR 0556 (12/01/20)` — "NOTICE OF INCOME WITHHOLDING FOR SUPPORT"; "ILLINOIS SUPPLEMENT TO THE INCOME WITHHOLDING ORDER FOR SUPPORT (IWO), OMB 0970-0154"; checkbox "Original Income Withholding Order/Notice for Support (IWO)"; stale printed OMB expiration 05/31/2014 | **Exact** (S3 object re-fetched) |
| Cook `CCDR 0059 (12/01/24)` — post-prove-up checkbox list includes "Uniform Order of Support" and "Order for Withholding" under "shall, within ___ days submit for Court approval" | **Exact** |
| Will clerk "Instructions for Electronic Filing of Proposed Court Orders for Family Cases" — all four quoted sentences incl. "Support Order/Withholding Order… under the same eFile Envelope", separate-PDF rule, and "No proposed Orders will be entered by the Judge unless first presented on the record in Court" | **Exact** (retrieved via lowercase `/portals/0/` path; capitalized path is robots-blocked — same case-sensitivity quirk previously documented for Will) |
| FR Doc 2026-13910 — 91 FR 42734–42735; "The current OMB approval expires August 31, 2026."; "Comments due August 10, 2026."; one-year state-transition extension request; authority 42 U.S.C. 666(a)(1), (a)(8), (b)(6) | **Exact** (official full-text endpoint) |
| Reginfo — ICR 202602-0970-006 approved without change 02/20/2026, expiration 08/31/2026; ICR 202607-0970-002 "Received in OIRA" 07/10/2026, requested "36 Months From Approved", no conclusion | **Consistent** with this session's independent 16:39 UTC retrievals |
| ATJ 127.3 (09/25) "Do not file this form with the Circuit Clerk." and post-order completion | **Exact** (re-verified twice this session) |
| ATJ 131.2 (09/25) — "Give this letter to the Employer. Do not file it."; "With each letter, include the Income Withholding for Support and the Order for Support."; certified-mail + simultaneous payor-copy instructions | **Exact in substance** — see Advisory A2 on the cited URL |

**Advisories (both P3, non-blocking):**

- **A1 — resolved before outbound use.** The v13 rules PDF exposes no substantive machine-readable text layer. On 2026-07-27 at `20:09:42Z`, the official 92-page PDF was retrieved from the published Twelfth Circuit URL (PDF SHA-256 `d049e54cf4b3766112012b6ab58591e4dd2a2f95fc59d9c28387525d9264fc18`). PDF page 39 / printed page 27 was rendered at 300 DPI (PNG SHA-256 `d1faddca0b133cd26e22a1e6077ed98859e1dee2bc408547dd8e69faf042ec0b`) and visually inspected. The printed Rule 8.09(C) text exactly matches the quoted text in this audit and the outbound clarification request. This resolves the transcription advisory only; it does not resolve the instrument-identity or filing conflict.
- **A2 — LW-13 URL defect.** The bundle cites the ATJ 131.2 employer letter at `…/4c571ce4-…/DCS Letter to Employer With Instructions.pdf`, which returned 404 on independent re-fetch; the same GUID with filename `DCS Letter to Employer Withholding.pdf` resolves and carries the quoted content and the ATJ 131.2 (09/25) footer. Consistent with the known blob-filename instability; the substance is verified, the printed URL is not stable. Cite the GUID-bearing `illinoiscourts.gov/resources/<guid>/file` form instead.

## 3. Delta disposition (what changed evidentially — no gate moves)

| Verifier item | State | Delta effect |
|---|---|---|
| `federal_iwo:omb_renewal_review_pending` | **retained** | Current collection Active through 2026-08-31; ICR 202607-0970-002 still "Received in OIRA", no conclusion. A submitted revision + FR notice is not approval. |
| `omb_renewal_review:pending` | **retained** | Same. |
| `county_packet_composition:unconfirmed` | **retained** | New bounded evidence, no closure: Lake's 19th Circuit prove-up list names "Notice to Withhold Income for Support" (identity as OMB 0970-0154 unestablished); Will Rule 8.09(C) supplies a conditional serve→file→notify rule (identity unestablished); Will clerk guidance names a proposed "Withholding Order" (identity unestablished); Cook publishes CCDR 0556 which *expressly* prints OMB 0970-0154 but is a 2020 revision with a stale printed OMB expiration, and appears on no Cook prove-up checklist; DuPage and Kane surfaces produce no IWO item (omission ≠ prohibition). |
| `county_efiling_treatment:unconfirmed` | **retained** | Will supplies conditional filing/proposed-order mechanics but instrument identity is unresolved and Rule 8.09(C)'s file-after-service command **textually conflicts** with statewide ATJ 127.3's do-not-file command. The conflict is preserved, not harmonized; no source decides which controls or whether the instruments are identical. |
| `unsupported_required_gaps` | **no change from this research** | HEAD-dependent (29 at `9fae119`, 18 at `dda3393e` on `codex/fs-structured-intake-cleanbase-20260727` — both verified against git this session). Read from the verifier at the exact deployment target HEAD. |
| `launchReadiness` | **HOLD** | Unchanged. No blocker cleared by this delta. |

**Verifier state was not modified.** This addendum is documentation only.

## 4. New material fact for D-6 (IWO packet-composition decision)

The Will/statewide conflict is now the sharpest open question in the IWO track: an official Twelfth Circuit local rule commands filing after employer service while the statewide ATJ instruction commands non-filing, for instruments carrying the same generic name. After visual verification of Rule 8.09(C), a clarification request was sent to the Will County Circuit Clerk's official General Inquiry address on 2026-07-27; see `docs/legal-audit/will-county-iwo-clarification-sent-2026-07-27.md`. Product and counsel must not resolve the conflict by inference while a response is pending.

## 5. Standing operational holds (recorded, not created, by this addendum)

- **Branch hold:** `codex/fs-structured-intake-cleanbase-20260727` is 37 commits ahead of `origin/main`, 68 files in diff, no PR. **Do not push** until a branch-stack review completes; a push could trigger a broad preview/release lane.
- **OMB monitoring:** current approval expires **2026-08-31**; pending ICR comment period closes **2026-08-10**. Next useful monitoring point is after 2026-08-10, then continuously through 2026-08-31. On any conclusion of ICR 202607-0970-002, re-pin `expectedSha256`/`expectedBytes`/`expiration` before any gate movement; on 2026-09-01 with no concluded successor, treat as hard expiry.
- **Safe sequence:** delta review (done) → audit addendum (done) → visual Rule 8.09(C) confirmation (done) → Will clarification sent and delivery confirmed (done) → response tracking/OIRA monitoring → branch-stack review.

*Prepared as an evidence record only. No legal conclusion; no launch recommendation; no statewide claim from any single county's rules.*
