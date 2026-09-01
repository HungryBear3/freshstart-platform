# IWO — OMB renewal confirmed and legacy-form transition (evidence overlay)

**Overlay date:** 2026-09-01
**Applies to:** federal Income Withholding for Support, OMB control number 0970-0154
**Status of this document:** ADDITIVE OVERLAY. It does not amend, rewrite, or
retire the frozen July/August evidence in this directory
(`iwo-federal-provenance-2026-07-21.json`,
`iwo-source-closure-delta-audit-2026-07-27.md`,
`iwo-artifact-relocation-overlay-2026-08-10.json`,
`will-county-iwo-conditional-addendum-2026-08-09.md`). Those records remain
accurate as of their own dates. This overlay records what changed after them.

**This is not legal advice, and not a determination that any court, clerk,
employer, or case will accept a particular version of this form.**

---

## 1. What changed

The `omb_renewal_review_pending` state pinned on 2026-07-21 is superseded.

OIRA concluded the renewal on **2026-08-25** and approved the collection
**without change**. The 2026-07-21 record was correct when written; it is stale
now.

What did **not** change: the artifact. The live ACF canonical endpoint returned
the byte-identical PDF already pinned by FreshStart, and the Illinois Courts
approved-forms page still links that same canonical ACF URL.

## 2. Three dates, not one

The renewal does **not** mean the pinned expiration moves to 2029-08-31. Three
separate facts apply, and the released code collapsed them into a single
`expiration` field:

| Fact                                | Value        | What it governs                                          |
| ----------------------------------- | ------------ | -------------------------------------------------------- |
| Printed legacy-PDF date             | `2026-08-31` | Nothing. Display metadata — what the paper says.         |
| OIRA collection approval expiration | `2029-08-31` | When the next renewal review is due.                     |
| Legacy-form transition end          | `2027-08-25` | The operative cutoff for distributing this legacy print. |

The approved supporting statement is explicit that these come apart: OCSE asked
to extend the **currently approved IWO for one additional year** so states can
program the revised form and e-IWO layout, and the revised collection is
effective **one year from OMB approval if programming time is needed**. An
approval that runs to 2029 is therefore not authority to distribute the 2026
legacy print until 2029.

The supporting statement also records **why** the printed date is dangerous as a
gate: OCSE moved the OMB expiration date off the revised form and into its
instructions because employers had mistakenly treated a printed expiration as a
termination date for the support order. FreshStart made the structurally same
mistake in code, in the other direction — it refused a form that was still
distributable, and told the user renewal was under review after renewal had been
confirmed.

### 2.1 Basis for 2027-08-25, and its caveat

`2027-08-25` is **derived, not published**: one year from the 2026-08-25 OIRA
approval date, per the agency's own one-year language.

A commenter in the official comment tracker describes an **`August 31, 2027`**
implementation deadline. That wording is a third party's, not the agency's, and
it is deliberately **not** used as the operative cutoff. The earlier, more
conservative date is used instead.

**Re-pin `legacyTransitionFirstBlockedDate` if ACF publishes an explicit implementation or
effective-date notice.** Until then it is a conservative floor, and it fails
closed.

## 3. Evidence pinned

### 3.1 OIRA conclusion and Notice of Action

- ICR: `202607-0970-002`
  <https://www.reginfo.gov/public/do/PRAViewICR?ref_nbr=202607-0970-002>
  Status `Active`; conclusion action `Approved without change`; conclusion date
  `08/25/2026`; OMB control number `0970-0154`; expiration `08/31/2029`.
- Notice of Action:
  <https://www.reginfo.gov/public/do/DownloadNOA?requestID=1826353>
  97,827 bytes; SHA-256
  `c2b68202cf4741b0f0a811457e40e6470b1fadce4a3a2f781e5dcb6b2c0df652`;
  2 pages, PDF 1.5, no AcroForm. Both rendered pages were visually reviewed and
  confirm the action, date, ICR, control number, expiration, and the two
  `IWO Form` IC rows.

**Non-durable hash caveat.** The ICR _webpage_ response hashed
`7af696720c8fa45d8ced7ba8aa784bc7f0b7968091bcc846c96a9f7a7455f96d`
(95,157 bytes). That is an **audit-response identifier only, not an authority
pin**: Reginfo injects per-session `jsessionid` and CSRF values, so repeated GETs
of the same unchanged record produce different whole-body hashes. The durable
pins are the NOA bytes above and the ICR fields asserted by parsed value.

### 3.2 Approved supporting statement and transition terms

- Supporting statement, Reginfo object `170863901` — DOCX, 53,572 bytes; SHA-256
  `aa7c52c254be46a0ebfaf394d1551b5c300d5a25aad41285a27ad8898d485933`.
  Source of the one-additional-year extension, the one-year-from-approval
  effectiveness, and the expiration-moved-to-instructions rationale.
- Proposed-change summary, object `170864101` — DOCX, 23,143 bytes; SHA-256
  `7e8fc75a53baa21446b4df673ba2fffe8eae2061ace3f12aae8368a48093f75d`.
  Confirms removal of the printed expiration and the employee/independent-
  contractor additions.
- Comment tracker, object `170864001` — DOCX, 285,980 bytes; SHA-256
  `5cec90049b1803eb1a6ffd9bda051f040405c2bce41bf5881d92b626f0edb0b6`.
  Records OCSE's statement that states continue to have one year to implement
  the revised form and e-IWO record layout, and the third-party `August 31, 2027`
  wording described in §2.1.

### 3.3 The current artifact — unchanged

- Canonical ACF PDF:
  <https://acf.gov/sites/default/files/documents/ocse/omb_0970_0154.pdf?download=1>
- Retrieved `HTTP 200`, `application/pdf`, **505,412 bytes**, SHA-256
  **`2b15c02a46b66a7d0fa2bd80d4644d5d6d5e6798911225f8e0272b45fe20b551`**.
- `cmp` exit 0 against `private/official-forms/income-withholding-order.pdf` in
  the released tree — byte-identical.
- 4 pages, PDF 1.6, 112 AcroForm fields. Printed title
  `INCOME WITHHOLDING FOR SUPPORT`; printed `OMB 0970-0154`,
  `Expiration Date: 08/31/2026`. All four pages rendered and visually reviewed;
  no corruption, clipping, or unexpected layout.

**The bytes, path, SHA-256, byte length, MIME, title/control metadata, and the
112-field mapping are unchanged by this overlay and by PR-2A.**

### 3.4 WAF challenge on the later retrieval — read this before releasing

An independent verification later on 2026-09-01 reproduced the repository PDF's
bytes, metadata, field count, and rendering. The **live ACF endpoint then
returned an AWS WAF challenge (`HTTP 202`, zero PDF bytes).**

Two things must both be said, and neither may be dropped:

1. That transient challenge **does not disprove** the earlier exact-byte
   retrieval in §3.3. A WAF interstitial is not evidence about the document.
2. It is **not a substitute for a fresh retrieval either.** PR-2A must not be
   released unless a fresh GET again returns `HTTP 200`, `application/pdf`, and
   the exact pinned hash and length — or a newly reviewed official replacement
   packet changes the evidence.

The Illinois link alone is **not** byte-continuity proof.

### 3.5 The revised successor is DOCX-only — do not ship it

The revised IWO submitted with the approved ICR is materially different: it adds
employee/independent-contractor indicators and a daily-pay-period line, revises
nonemployee/other-income language, updates links, and removes the printed OMB
expiration from the form.

Reginfo exposes it as **DOCX, not as a final ACF fillable PDF**:

- object `170850302` — 50,777 bytes; SHA-256
  `6cc4f2c57ae0b590591caad4b9335f2fbe55df4f663cdb1daa001b07e4b4e6e3`
- object `170850402` — 50,777 bytes; SHA-256
  `b245fe5dba479718e01bf428215d1af87628a92aae34cae61dbd42e2a797990d`

The two containers differ; the extracted document bodies are the same approved
revised content. **Neither is a substitute for a final ACF fillable PDF, and
neither may be converted and shipped by FreshStart.** The legacy artifact is not
relabelled as the revised form anywhere in code.

### 3.6 Illinois — still linking the legacy artifact

- Illinois Courts approved-forms page (divorce / child support / maintenance):
  still labels the artifact `Income Withholding for Support` and points to the
  exact canonical ACF URL in §3.3. Audit-response SHA-256
  `3e764490b793e20bd4674189866d270662046fda17c5f5bb1b7b3271185591f1`
  (187,013 bytes).
  **Non-durable hash caveat:** the page carries changing view-state/cache-buster
  values, so this whole-page hash is an audit-response identifier only. The
  durable check is the parsed official form label plus target URL, together with
  the exact linked-PDF byte gate.
- Illinois companion instruction `DV-WI 130.3 (03/23)`, 4 pages, 732,299 bytes;
  SHA-256 `a344ecbd7ff66f73e2ba1ebc19c963b88f34f0aecf707cfa8c457eb4db7f8815`.
  All four pages rendered and visually reviewed. It illustrates an older print
  and remains a legacy field-semantics companion. **It is not evidence that
  Illinois has adopted the revised 2026 form.**

### 3.7 Will County — unchanged

Federal renewal changes nothing about the direct clerk evidence. Will remains
`manual_conditional`: no universal include, file, omit, or proposed-order rule.

- response addendum SHA-256
  `c7bcf7fbb56f3cc7c95c79a1fc1217c5b2671688ae0cdaa099bcbde96d572cfc`
- verbatim response SHA-256
  `f0d3bd46974c4d7243cf7111c1f6dcfffd7a15a95e69029acefca2a634d4984b`
- manifest SHA-256
  `eb52692f5d3a2d3ab3f27fab7d6422188d2ec7536a3936978f29137eec6571f8`

## 4. What PR-2A changed in code

- `lib/forms/iwo-provenance.ts` — the single `expiration` field is retired and
  replaced by `printedExpirationDate`, `collectionApprovalExpiration`, and
  `legacyTransitionFirstBlockedDate`. `PINNED_OIRA_APPROVAL` pins the ICR, action, approval
  date, collection expiration, and the NOA URL/hash/length.
  `PINNED_RENEWAL_EVIDENCE` moves to `confirmed`, reviewed 2026-09-01. The
  operative cutoff is `legacyTransitionFirstBlockedDate`, evaluated as a whole
  America/Chicago calendar day, fail closed. The renewal-review window is
  measured against `collectionApprovalExpiration`, so a confirmed renewal is
  never reported as pending.
- `lib/forms/official-artifact-access.ts` — gate documentation corrected;
  `describeIwoProvenance()` surfaces the three dates under three distinct names
  and no longer exposes a single ambiguous `expiration`.
- `lib/forms/iwo-refusal-copy.ts` — **one approved string changed, on owner
  instruction (2026-09-01), superseding the 2026-08-24 wording for that string
  only.** The `federal_form_authority_expired` first paragraph no longer says
  "the period Fresh Start is authorized to distribute the selected version has
  ended"; it says "Fresh Start has stopped distributing the selected version of
  this form". The retired sentence asserted that an external authorization period
  existed and ended, but the date closing this gate is FreshStart's own
  conservative derivation (§2.1), not a published ACF expiry — it claimed an
  agency-set fact no source states. The replacement describes only Fresh Start's
  own conduct. This must be logged against `OWNER-COPY-APPROVAL-20260824.md`. The
  other three copy blocks and the fail-closed precedence are unchanged, and
  `federal_form_renewal_pending` is unreachable from pinned evidence while
  renewal is confirmed.
- `lib/counties/county-iwo-workflow.ts` — comment terminology only. **No county
  disposition, lane, or packet-placement behavior changed.**

## 5. What PR-2A did NOT do

- No revised-form DOCX conversion, and no shipping of the revised form.
- No new IWO field mappings; the IWO is still never filled or generated.
- No change to the PDF bytes, path, hash, byte length, MIME, or metadata.
- No Illinois or Will workflow change; Will stays `manual_conditional`.
- No static/public artifact path; no universal packet inclusion.
- No customer, court, provider, payment, database, or deployment action.

## 6. Release gate

Even a green local candidate is **RELEASE BLOCKED** until either:

1. a fresh ACF retrieval returns `HTTP 200`, `application/pdf`, and reproduces
   `2b15c02a46b66a7d0fa2bd80d4644d5d6d5e6798911225f8e0272b45fe20b551` at
   505,412 bytes; or
2. a newly reviewed official replacement packet changes the evidence above.

Rollback is code-only: reverting PR-2A restores the released baseline, which
refuses the IWO for every county. No data migration or artifact replacement is
involved, because the artifact never moved.
