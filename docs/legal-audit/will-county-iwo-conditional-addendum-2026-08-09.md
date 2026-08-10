# Will County IWO — manual/conditional implementation addendum

**Date:** 2026-08-09
**Scope:** Repo-local record of the evidence basis for the Will County IWO
manual/conditional workflow and the federal IWO currentness gate.
**Status:** Controller review. Not launch-ready. No filing, deploy, or customer action.

This addendum does not rewrite, supersede, or delete any frozen prior evidence.
The July 27 bundle and the July 31 clerk-response addendum remain authoritative
and unmodified in the research record.

## 1. Direct correspondence classification

The Will County Circuit Clerk response dated 2026-07-31 is classified as
**user-supplied direct official correspondence**. The rendered body and display
metadata were supplied; full transport headers and the original `.eml` were not.

Accordingly it is **not** treated as:

- a court order,
- a standing or administrative order,
- a universal legal rule, or
- a determination of which instruction controls any particular case.

No missing transport metadata is inferred. The verbatim text is preserved in the
research record (see §5).

## 2. Exact confirmed facts

Confirmed by the correspondence:

1. The Rule 8.09(C) "Income Withholding for Support", the clerk's proposed
   "Withholding Order", and the federal Income Withholding for Support form
   bearing OMB control number 0970-0154 **refer to the same instrument**.
2. The **Support Order** referenced in the family-law e-filing instructions is
   the separate state-approved form **ATJ 129.5**, distinct from the IWO.
3. The published Will County local rule **directs** that the form be filed with
   the Circuit Clerk **after** it is served on the employer.
4. Clerk staff report that **actual practice varies**; filers sometimes file and
   **more frequently do not**.
5. Court services staff most frequently observe filing **when the filer's
   employer has changed**.
6. Courtroom-clerk staff describe a **typical judge-directed package**: complete
   and serve the IWO plus ATJ 131.2 on the employer, together with a copy of the
   judge-signed ATJ 129.5.
7. A **proposed-order lane** exists and is used occasionally, filed under
   "Proposed Order", routed to the judge's review queue for signature or
   rejection with direction to serve the employer.
8. If a filer does e-file the IWO, the identified e-filing code is
   "Income Withholding for Support".
9. Proof of notice to all parties is **rarely observed** as filed. If filed,
   ATJ 851.7 under "Proof of Delivery" or "Proof of Service/Certificate of
   Service" is identified as appropriate; a signed affidavit is accepted.
10. Responding staff identified **no** standing-order supplement or supersession
    of Rule 8.09(C) — bounded negative evidence only.

## 3. Unresolved conflicts and gates

The textual conflict is **not erased** by the correspondence:

| Source | Instruction |
|---|---|
| Will County Circuit Court Rule 8.09(C) | IWO served on the employer **shall be filed** with the Circuit Clerk |
| Statewide form instruction ATJ 127.3 | "**Do not file** this form with the Circuit Clerk." |

Open gates:

1. **Case-specific direction** — whether the presiding judge directs ordinary
   employer service, filing, or proposed-order submission.
2. **Notice content** — whether Rule 8.09(C) contemplates notice of the *fact* of
   service or service of the *complete instrument* on all parties. Proof methods
   are identified; the underlying scope is not squarely stated.
3. **Universal packet placement** — **not established** for either the opening
   packet or the prove-up set.
4. **Federal currentness** — OMB 0970-0154 carries printed expiration
   `2026-08-31`; renewal was in progress as of 2026-07 and is **unconfirmed**.

## 4. Manual/conditional consequence

Because the sources conflict on (3) and are silent on (2) and (4) above, the
safe operational classification for Will County is **`manual_conditional`** —
not "always file", not "never file".

Implemented consequences:

- The IWO is **withheld from automatic packet composition** for Will County in
  both the opening packet and the prove-up set. It is surfaced as a **deferred
  manual-review item**, not silently dropped; case data is preserved.
- Employer service, post-service filing, proposed-order submission, and
  notice/proof are modeled as **independent conditional lanes**, each defaulting
  to `conditional_unresolved`.
- A supplied case-specific direction may move a lane to
  `directed_by_case_specific_input`, but `autoDecided` remains `false` and the
  workflow never reports `completed`. The product does not synthesize direction.
- The employer-change scenario is its own conditional lane, recorded as
  staff-observed practice rather than a rule.
- Counties without an identified county-specific conflict retain their existing
  `statewide_default` composition unchanged.

Federal currentness gate (fail-closed):

- The on-disk print must match the pinned SHA-256
  `2b15c02a…b551` and byte length `505412`. A file merely *named*
  `income-withholding-order.pdf` can never clear the gate.
- Expiration is evaluated against the **America/Chicago calendar date** and
  fails closed for the **entire** expiration day: local date `>= 2026-08-31` is
  expired. The cutoff instant is `2026-08-31T05:00:00Z`; the last allowed
  instant is `2026-08-31T04:59:59.999Z`. This adopts the stricter artifact-guard
  policy from `cc/fs-iwo-artifact-guard-20260805` and retires the earlier
  `2026-08-31T23:59:59Z` cutoff, removing the cross-branch divergence.
- Renewal status is pinned **evidence**, not a parameter. `computeLaunchReadiness`
  has no `ombRenewalReview` argument; a runtime caller cannot clear a pending
  renewal. Moving it to `confirmed` requires editing the pinned constant after an
  independently verified renewal, alongside a re-pinned hash/expiration. There is
  **no exported mutable override**: renewal is threaded as an explicit dependency,
  and tests inject it through the route/guard/package factories, which product
  entry points do not expose.
- The document-package boundary applies **two independent gates**: policy
  (authoritative county + federal currentness) authorizes the *form*; payload
  verification authorizes the *bytes*. A stored row that passes policy but whose
  decoded content is not byte-identical to the pinned print (wrong hash, wrong
  length, wrong MIME, missing, or malformed base64) is withheld and disclosed in
  `00_WITHHELD_ITEMS.txt`. Because the pin is the unfilled canonical federal
  print, only an unmodified copy can pass — consistent with this product, which
  has no IWO field mappings and never fills the form.
- When ready documents existed but every one was withheld, the package is still
  returned **with** the disclosure file rather than collapsing to a generic 404.
  A 404 is reserved for the genuinely-empty case. The cover sheet lists only what
  was actually written, so it can never claim a withheld item was included.
- The artifact is stored in `private/official-forms/`, **outside `public/`**, so
  there is no static URL for it. It is released only by
  `app/api/forms/iwo/route.ts`, which re-validates county identity, county
  disposition, byte hash, expiration, and renewal state on **every** request and
  returns 403 with zero bytes when any gate is closed.
- The Court Forms Library renders from a server-side read model
  (`lib/forms/court-forms-read-model.ts`); a gated form is removed from the
  rendered catalog entirely, so no download control can exist for it.
- Unknown, blank, malformed, or noncanonical county ids fail closed to manual
  review. A non-`will` value is **not** assumed to be `statewide_default`.
- The federal gate applies to **all** counties: a non-Will county keeps its
  statewide procedural default only while that gate is open.
- Missing, wrong-hash, expired, or renewal-pending states all render the form
  **not usable** in the workflow, so it cannot be presented as current/ready.
- The PDF is **not fetched or replaced** by any code path here, and the IWO has
  **no field mappings** — it is not filled or generated by the product.

## 5. No-legal-conclusion boundary

This addendum and the code it describes record **procedural information** drawn
from the cited sources. They do not state which instruction controls, do not
advise any filer, and do not determine a case-specific filing path. Where the
sources conflict or are silent, the product reports that and stops.

Fresh Start is not a law firm and does not provide legal advice.

## 6. Source paths

Already present in the evidence packet — not restated or re-derived here:

- `rex/research/illinois-divorce-county-baseline-20260727-next-response-20260731/WILL-IWO-CLERK-RESPONSE-ADDENDUM.md`
- `rex/research/illinois-divorce-county-baseline-20260727-next-response-20260731/will-clerk-response-verbatim.txt`
- `docs/legal-audit/iwo-source-closure-delta-audit-2026-07-27.md`
- `docs/legal-audit/will-county-iwo-clarification-sent-2026-07-27.md`
- `docs/legal-audit/FS_OFFICIAL_FORM_EVIDENCE_2026-07-21.md`
- `docs/legal-audit/iwo-federal-provenance-2026-07-21.json`
- Standing-order index supplied by respondent: <https://www.circuitclerkofwillcounty.com/Judge-Rules>
- Federal print canonical URL: <https://www.acf.hhs.gov/sites/default/files/documents/ocse/omb_0970_0154.pdf>

## 7. Implementation provenance note

`lib/forms/iwo-provenance.ts` is an **adapted fork** — not a verbatim copy — of
the IWO hunk of `scripts/verify-form-field-mappings.ts` as it exists on branch
`fs-pricing-value-over-free`.

**Carried unchanged:** the pinned identity constants (file, provenanceClass,
ombNumber, expiration, canonicalUrl, expectedSha256, expectedBytes,
companionAuthority, excludedStaleVariant, renewalReviewWindowDays), the
hash/byte provenance check, and the blocker vocabulary. Values were re-verified
against the actual carried PDF (SHA-256 and byte length both match) and against
`iwo-federal-provenance-2026-07-21.json`. Nothing was re-derived from scratch.

**Deliberate policy deltas from that source** — each a controller decision, not
drift:

1. **Expiration** is evaluated on the America/Chicago **calendar date** and
   fails closed for the whole expiration day (`localDate >= expiration`). The
   source used a `2026-08-31T23:59:59Z` instant cutoff.
2. **No caller renewal override.** `computeLaunchReadiness` no longer accepts
   `ombRenewalReview`; renewal is pinned evidence threaded as a dependency.
3. **Renewal state relocated** out of `IWO_PROVENANCE` into
   `PINNED_RENEWAL_EVIDENCE`, giving exactly one source of truth.
4. **Guarded artifact path.** The artifact is read from
   `private/official-forms/`, never `public/forms/`; `computeLaunchReadiness`
   takes a separate `iwoArtifactDir`.

Only the IWO hunk was forked. The mapping-verification half of that script
depends on `getStructuralMapping` / `isActiveMapping`, which do not exist in this
branch's `field-mappings.ts`; carrying them would have pulled in unrelated
mapping/intake changes that are out of scope for this branch.

### Historical evidence vs. current state

The imported July 2026 evidence files are **historical records and are not
rewritten**, so they still name `public/forms/income-withholding-order.pdf` as
the artifact path. That was true when they were written. The current guarded
path is recorded separately in
`docs/legal-audit/iwo-artifact-relocation-overlay-2026-08-10.json`, which
authenticates each imported file by SHA-256 and records the relocation. The PDF
bytes are unchanged; no fetch or replacement occurred.

## 7a. Authoritative county binding

Canonical **syntax** is not authoritative **identity**. The download route does
not accept a county from query string, body, header, or cookie. It resolves the
county server-side from the authenticated user's `CaseInfo` record and fails
closed on: no session, no case, no stored county, or a stored value that is not
a canonical county id. Because `CaseInfo.county` is free text today (the UI
placeholder is "e.g., Cook County"), the common outcome is refusal — which is
the intended behavior, not a defect.

The same server-owned county is applied at the document-package boundary
(`/api/documents/package`), so an already-`ready` IWO row cannot be released
through that independent path.

## 7b. Surface status

`/legal-info/court-forms` is served a **308 permanent redirect to `/legal`** by
`next.config.ts` (Next.js emits 308, not 301, for `permanent: true`; verified
against a local production server). Runtime redirect behavior is unchanged.
The Court Forms Library page and its read model are therefore **dormant** — they
are wired through the guard so the redirect can be lifted safely later, but no
production reachability is claimed and the redirect is unchanged by this work.

## 8. Verification footer

- Frozen July 27 bundle: not modified.
- July 31 clerk-response addendum: not modified.
- Official PDF: carried byte-identical; not fetched, replaced, or regenerated.
- Field mappings: not modified; no mapping added for the IWO.
- Customer, filing, payment, deploy, or document action: none.
