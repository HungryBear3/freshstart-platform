# IWO open-path disclosure — owner copy decision required

**STATUS: UNAPPROVED — DRAFT VARIANTS ONLY — NOT WIRED**

**Raised:** 2026-09-05
**Applies to:** federal Income Withholding for Support, OMB control number 0970-0154
**Blocks:** distribution of the legacy artifact on the SUCCESSFUL path
**Runtime state while unapproved:** `open_path_disclosure_unapproved` — distribution
fails closed and says nothing (`lib/forms/iwo-distribution-hold.ts`).

> Nothing in this file is approved. Nothing in this file is wired into the
> product. The variants below are DRAFTS written to give the owner something
> exact to accept, amend, or reject. A test asserts that no line of them appears
> in any shipped copy surface, so accidentally shipping one fails the build.

---

## 1. The decision being asked for

Approve the exact wording (or supply different wording) that Fresh Start shows a
customer **when it successfully hands over** the federal IWO.

This is not a refusal message. Every refusal path already has approved copy.
This is the path where the customer actually receives the file.

## 2. Why it is being asked

Both of the following are true of the artifact Fresh Start distributes, and
neither is currently disclosed to the person receiving it:

1. **The printed date on the paper is in the past.** The legacy ACF print carries
   `Expiration Date: 08/31/2026` on its face. That date is display metadata and
   is not an operative cutoff — Fresh Start models it as
   `printedLegacyPdfDate` and gates on nothing — but the customer holding the PDF
   sees a date that has passed and has no way to know it is not a deadline.
2. **An approved revised successor exists.** OIRA concluded ICR
   `202607-0970-002` on `2026-08-25`, approving the collection without change
   through `2029-08-31`, and the approved package includes a revised IWO. Reginfo
   exposes that revised form as DOCX only; there is no final ACF fillable PDF,
   and Fresh Start may not convert or ship it. So the legacy print remains the
   only artifact Fresh Start can distribute, and it will remain so until ACF
   publishes a final PDF.

Fresh Start's own conservative transition boundary for the legacy print is
`2027-08-25` (`legacyTransitionFirstBlockedDate`), derived from the agency's
one-year language and **not** a published ACF acceptance deadline.

**None of the above is an expiry of the form, an OMB status, or an agency
determination about acceptance, and no approved wording may say that it is.**

## 3. Constraints any approved wording must satisfy

- States only what Fresh Start knows and does. No claim about whether any court,
  clerk, employer, or case will accept any version.
- Does not call the printed `08/31/2026` date an expiration, a deadline, or a
  termination date.
- Does not assert that the legacy form is invalid, superseded in law, or no
  longer usable.
- Does not state or imply an ACF acceptance deadline. `2027-08-25` is Fresh
  Start's own derived boundary; it is not published and must not be presented as
  an agency date.
- Carries the standing "procedural information, not legal advice" line.

## 4. Draft variants

**Both are UNAPPROVED. Both are NOT WIRED.** Exactly one may be selected, or
neither.

### Variant A (UNAPPROVED — NOT WIRED) — minimal, printed-date only

```text
The federal Income Withholding for Support form (OMB 0970-0154) included here is the version currently published by the federal agency at its official address. The date printed on the form itself reads 08/31/2026.
Fresh Start is not able to tell you whether a court, clerk, or employer will accept a particular version of this form. This is procedural information about what Fresh Start distributes, not legal advice.
```

### Variant B (UNAPPROVED — NOT WIRED) — printed date and revised-version fact

```text
The federal Income Withholding for Support form (OMB 0970-0154) included here is the version currently published by the federal agency at its official address, and the date printed on the form itself reads 08/31/2026. A revised version of this form has been approved but has not been published by the agency as a completed fillable form, so Fresh Start distributes the published version.
Fresh Start is not able to tell you whether a court, clerk, or employer will accept a particular version of this form. This is procedural information about what Fresh Start distributes, not legal advice.
```

### Note on the drafts

Variant A says less and is easier to keep true. Variant B tells the customer the
thing they would most likely want to know — that a newer version exists — at the
cost of a second sentence that must be re-checked whenever ACF publishes.
Neither is recommended here; the choice is the owner's.

## 5. What happens on approval

1. The approved variant is added verbatim to `lib/forms/iwo-refusal-copy.ts` (or
   a sibling approved-copy surface) with a character-exact pinning test.
2. A durable approval entry is recorded. `docs/legal-audit/iwo-copy-approval-ledger.md`
   holds only the PENDING request; it is not an approval and must not be edited
   into one.
3. `PINNED_OPEN_PATH_DISCLOSURE_APPROVAL.status` in
   `lib/forms/iwo-distribution-hold.ts` moves to `approved` **in the same
   change**, and distribution opens for canonical non-Will counties.

Until all three happen, the hold stands.

## 6. What this file is not

- Not an approval, and not evidence that one was sought outside this repository.
- Not a statement about OMB, OIRA, ACF, or Illinois status. The pinned evidence
  in `iwo-omb-renewal-transition-2026-09-01.md` is unchanged.
- Not legal advice, and not a determination that any court, clerk, employer, or
  case will accept any version of this form.
