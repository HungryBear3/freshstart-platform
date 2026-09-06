# IWO copy — PENDING approval ledger

## THIS FILE IS NOT AN APPROVAL

Every entry below records that something was **requested** or that a durable log
entry is **owed**. No entry records that anything was approved, and no entry may
be edited to say so. Approvals are recorded in the owner-held durable ledger
(`OWNER-COPY-APPROVAL-20260824.md`), which is outside this repository; this file
exists only so the outstanding items are visible in-branch instead of living in a
report paragraph nobody re-reads.

A test asserts that every `Status:` line here reads exactly
`PENDING — REQUESTED, NOT APPROVED`. Changing a status to anything else fails
that test, which is deliberate: moving an item to approved is an owner action
recorded in the owner-held ledger, not a repository edit.

**Maintained:** 2026-09-05

---

## Entry 1 — `federal_form_authority_expired`, first paragraph (2026-09-01 supersession)

- **Status:** PENDING — REQUESTED, NOT APPROVED
- **What this entry records:** that a durable ledger entry is **owed** and has not
  been written. It does not itself grant, confirm, or substitute for approval.
- **What is not in dispute:** the change itself was made on product-owner
  instruction of 2026-09-01. What is pending is the **durable record** of that
  instruction in the owner-held ledger, not the instruction. This entry is
  therefore not a claim that the string was changed without direction; it is a
  claim that the string has no approval of record. The module header of
  `lib/forms/iwo-refusal-copy.ts` states the same thing and must not be edited to
  say the string was "re-approved" while this entry stands.
- **How this differs from Entry 2:** this entry is a **shipped, owner-directed
  string awaiting its durable record**. Entry 2 is copy that **does not exist
  yet** — no wording has been supplied or chosen, and nothing is wired. Do not
  merge the two: clearing this one is a bookkeeping action in the owner-held
  ledger; clearing Entry 2 requires the owner to author or select wording first.
- **Reachability:** this string is emitted only once `federal_iwo_expired` fires,
  i.e. on or after `2027-08-25` in `America/Chicago`. It is not reachable on the
  current release, so the outstanding item is a governance record, not live
  unapproved copy. That does not make it optional.
- **Surface:** `lib/forms/iwo-refusal-copy.ts`,
  `IWO_OPERATIVE_REFUSAL_COPY.federal_form_authority_expired[0]`
- **Change made in code on 2026-09-01, retired sentence:**

  > …because the period Fresh Start is authorized to distribute the selected
  > version has ended.

- **Change made in code on 2026-09-01, replacement sentence:**

  > The federal Income Withholding for Support form (OMB 0970-0154) is not being
  > offered right now because Fresh Start has stopped distributing the selected
  > version of this form.

- **Why it was changed:** the retired sentence asserted that an external
  authorization period existed and ended. The date that closes this gate is
  `IWO_PROVENANCE.legacyTransitionFirstBlockedDate` (`2027-08-25`), which is Fresh
  Start's own conservative derivation from the agency's one-year language — not a
  published ACF expiry. The sentence therefore claimed an agency-set fact that no
  source states. The replacement describes only Fresh Start's own conduct.
- **Outstanding owner action:** record this supersession in
  `OWNER-COPY-APPROVAL-20260824.md`, scoped to this one string. The other three
  approved copy blocks are unchanged.
- **Evidence:** `docs/legal-audit/iwo-omb-renewal-transition-2026-09-01.md` §4;
  module header of `lib/forms/iwo-refusal-copy.ts`.

## Entry 2 — open-path disclosure copy (2026-09-05 request)

- **Status:** PENDING — REQUESTED, NOT APPROVED
- **What this entry records:** that exact wording has been **requested** from the
  owner and has not been supplied or approved.
- **Surface:** none. Nothing is wired. The runtime refuses with
  `open_path_disclosure_unapproved` and emits no user-visible sentence.
- **Decision artifact with the draft variants:**
  `docs/legal-audit/iwo-open-path-disclosure-copy-decision-2026-09-05.md`
- **What is being asked:** the exact disclosure a customer sees when Fresh Start
  **successfully** hands over the legacy federal IWO print — a path that
  previously carried no disclosure at all, while the artifact shows a past
  printed date on its face and an approved revised successor exists.
- **Not an expiry.** This hold is Fresh Start's own release decision. The pinned
  OIRA evidence is unchanged and remains open: ICR `202607-0970-002` concluded
  `2026-08-25`, approved without change, collection approval to `2029-08-31`.
- **Outstanding owner action:** select or supply exact wording, then wire it,
  record the approval in the owner-held ledger, and move
  `PINNED_OPEN_PATH_DISCLOSURE_APPROVAL.status` to `approved` in the same change.

---

## What this file is not

- Not an approval, and not a claim that one exists.
- Not a substitute for the owner-held durable ledger.
- Not legal advice, and not a determination that any court, clerk, employer, or
  case will accept any version of any form.
