# PR-2A — federal IWO OMB renewal and legacy-transition model

**Terminal handoff report**
**Date:** 2026-09-01
**Ownership:** ABBY OWNER RETAINS
**Overlap key:** `fs:iwo-pr2a-omb-transition`

## VERDICT: LOCAL CANDIDATE ONLY — RELEASE HELD FOR EXACT-SHA ACCEPTANCE

### Amendment 2, 2026-09-01 — commit `0f0e371dcb41576136a053b979736160fc65fbf2`

Applied on top of the reviewed commit `f2a233043500936a64db0d0a6dfd1270dae69a8c`
(tree `8b6986ac45a899739094645e6142a8ca35ca216d`) as a **new commit**; that
commit was not reset, rebased, amended, squashed, or rewritten, and remains in
this branch's history. Later commits may sit on top of `0f0e371` — see §1.

Closes the three in-branch items in the frozen review
`handoffs/cc-reviews-20260901/fs-pr2a-f2a2330-review.md`
(SHA-256 `93af8cb97fbe7f3e260299bb07b24959ffb3ff96094ea789be6c6b3327659004`),
against the frozen acceptance sheet
`fs-pr2a-frozen-sha-acceptance.md`
(SHA-256 `4d31ddc01fc86b7770a2ade90a79268e687a4a53b9e2cb881df0d27dd72044b4`):

1. **Acceptance-sheet name set finished** — `printedLegacyPdfDate`,
   `collectionApprovalExpiresOn`, `legacyTransitionFirstBlockedDate`. No
   ambiguous public alias is retained and no compatibility mapping was needed
   (§3).
2. **Stale contradictory comment block removed** from
   `lib/forms/iwo-refusal-copy.ts` — the paragraph that still asserted the
   retired authorization-period sentence "remains accurate" and "required no
   edit". The truthful supersession block and the renewal-pending explanation are
   kept (§3).
3. **Artifact-gate status corrected** — the 2026-09-01 `HTTP 200` queryless ACF
   retrieval is recorded, and the report no longer says the branch-cut retrieval
   is outstanding (§7).

Review item 4 (the durable copy-approval ledger) was **deliberately not done in
this branch**: see §9.3.

### Amendment 1, 2026-09-01

`f2a2330` superseded `bc450e83594d1df17cccddea8e25dca3ca2634cd`
(tree `021a0b46c1fe8b04056b8f18dffefbbf7f4485cb`) — retired, do not review. It
renamed `legacyTransitionEnd` to `legacyTransitionFirstBlockedDate` with the
derived names aligned, replaced the `federal_form_authority_expired` first
paragraph with the conduct-only sentence pinned by exact-copy tests, and made the
three files this slice creates Prettier-clean (repo-wide back to the base's 524).

The code is complete and green locally. It is **not** release-ready, and this
report does not claim it is. See §7.

---

## 1. Identity

|                    |                                                                       |
| ------------------ | --------------------------------------------------------------------- |
| Repository         | `https://github.com/HungryBear3/freshstart-platform.git`              |
| Exact base commit  | `c84e9a7cfb09a4e6aa68906383afa578e9691ce2`                            |
| Exact base tree    | `3593f2c53315c6efe69162902df4ecc31262cd60`                            |
| Branch             | `cc/fs-iwo-pr2a-omb-transition-20260901`                              |
| Worktree           | `/Users/abigailclaw/cc-worktrees/fs-iwo-pr2a-omb-transition-20260901` |
| Amendment 2 commit | `0f0e371dcb41576136a053b979736160fc65fbf2`                            |
| Amendment 2 parent | `f2a233043500936a64db0d0a6dfd1270dae69a8c` (tree `8b6986ac…`)         |
| Current HEAD/tree  | reproduce from Git — see note below                                   |

**On the current commit/tree identities.** This report is itself inside the
commit, so it cannot state its own commit or tree hash — writing either value in
would change both. Each commit's identities are emitted by the terminal handoff
summary that accompanied it, and the current ones are reproducible at any time
with:

```
git -C /Users/abigailclaw/cc-worktrees/fs-iwo-pr2a-omb-transition-20260901 rev-parse HEAD HEAD^{tree}
```

The reviewed commit `f2a233043500936a64db0d0a6dfd1270dae69a8c` remains in this
branch's history. It was not reset, rebased, amended, squashed, or rewritten, and
neither was any commit built on it.

This report deliberately does **not** state how long the branch currently is or
what the current `HEAD`'s parent is. Both are facts about the branch at the
moment you read it, and a report that lives inside the branch cannot state them
without invalidating itself the instant it is committed — which is exactly what
happened to the count this paragraph replaces. Reproduce them from Git instead:

```
git rev-list --count c84e9a7cfb09a4e6aa68906383afa578e9691ce2..HEAD
git log --format='%H %P' c84e9a7cfb09a4e6aa68906383afa578e9691ce2..HEAD
```

The second command prints each commit with its parent, so the chain back to the
pinned base — and the presence and position of `f2a2330` in it — is verifiable
directly rather than taken from this document.

### Preflight gates — all passed before any edit

- `git ls-remote origin refs/heads/main` → `c84e9a7cfb09a4e6aa68906383afa578e9691ce2`; its tree is `3593f2c53315c6efe69162902df4ecc31262cd60`. Both match the pinned base exactly.
- Branch `cc/fs-iwo-pr2a-omb-transition-20260901` did not exist. Worktree path did not exist.
- No writer holds overlap key `fs:iwo-pr2a-omb-transition` or any allowlisted path. The one adjacent worktree (`fs-iwo-pr1-20260824`, head `fec98eb190ad003689a19107a787a3629297f6bd`) carries tree `3593f2c5…`, i.e. **the identical tree** to the pinned base — PR-1's content is already in main. Nothing was read from, or written to, that worktree's tracked files.
- The isolated worktree was created **from the exact base commit**, not from the stale primary checkout (which sits on `fs-pricing-value-over-free` at `2b583f2`).
- All source hashes in `SOURCE-PACKET.md` §3 reproduced byte-for-byte before editing:

  | File                                    | SHA-256           |       |
  | --------------------------------------- | ----------------- | ----- |
  | `lib/forms/iwo-provenance.ts`           | `88b03f9f…40a75`  | match |
  | `lib/forms/official-artifact-access.ts` | `135d09e9…d55c1`  | match |
  | `lib/forms/iwo-package-guard.ts`        | `1523e12b…21233`  | match |
  | `lib/forms/iwo-refusal-copy.ts`         | `18aeed6a…bd150`¹ | match |
  | `lib/counties/county-iwo-workflow.ts`   | `9631c7bf…98898b` | match |
  | `app/api/forms/iwo/route.ts`            | `d7cada2d…1fbfc`¹ | match |

  ¹ truncated for the table; every value was compared in full against the packet.

- Artifact: `private/official-forms/income-withholding-order.pdf` →
  `2b15c02a46b66a7d0fa2bd80d4644d5d6d5e6798911225f8e0272b45fe20b551`, 505,412 bytes. Match.

## 2. Changed files and diffstat

Cumulative, base → `0f0e371`. **This is no longer the whole branch:** `0f0e371`
was the last code/evidence commit *at the time this section was written*, and two
later commits changed code — see the second table below and §3.1–§3.2.

```
 __tests__/api/documents-package-iwo.test.ts        |   5 +-
 __tests__/api/forms-iwo-route.test.ts              |  39 +-
 .../lib/counties/will-iwo-conditional.test.ts      | 127 +++++--
 __tests__/lib/forms/iwo-omb-transition.test.ts     | 413 ++++++++++++++++++++
 __tests__/lib/forms/iwo-refusal-copy.test.ts       |  23 +-
 .../iwo-omb-renewal-transition-2026-09-01.md       | 260 +++++++++++++
 lib/counties/county-iwo-workflow.ts                |  10 +-
 lib/forms/iwo-provenance.ts                        | 203 ++++++++--
 lib/forms/iwo-refusal-copy.ts                      |  44 ++-
 lib/forms/official-artifact-access.ts              |  31 +-
 reports/cc/fs-iwo-pr2a-omb-transition-20260901.md  | 415 +++++++++++++++++++++
 11 files changed, 1490 insertions(+), 80 deletions(-)
```

Amendment 2 alone, `f2a2330` → `0f0e371`:

```
 .../lib/counties/will-iwo-conditional.test.ts      |   6 +-
 __tests__/lib/forms/iwo-omb-transition.test.ts     |  28 ++--
 .../iwo-omb-renewal-transition-2026-09-01.md       |  41 ++++--
 lib/forms/iwo-provenance.ts                        |  50 ++++---
 lib/forms/iwo-refusal-copy.ts                      |  21 +--
 lib/forms/official-artifact-access.ts              |   4 +-
 reports/cc/fs-iwo-pr2a-omb-transition-20260901.md  | 148 +++++++++++++++------
 7 files changed, 193 insertions(+), 105 deletions(-)
```

Cumulative, base → `d1a2005` (the branch's last code commit — 29 files,
+3846 / −180):

```
 __tests__/api/documents-by-id-iwo-gate.test.ts     | 282 +++++++++++++
 __tests__/api/documents-by-id-iwo-payload.test.ts  | 214 ++++++++++
 __tests__/api/documents-list-iwo-gate.test.ts      | 229 ++++++++++
 .../api/documents-package-disclosure-hold.test.ts  | 244 +++++++++++
 __tests__/api/documents-package-iwo.test.ts        |  27 +-
 __tests__/api/forms-iwo-route.test.ts              |  74 +++-
 __tests__/forms/verify-illinois-forms.test.ts      |   5 +-
 .../lib/counties/will-iwo-conditional.test.ts      | 144 +++++--
 __tests__/lib/forms/iwo-omb-transition.test.ts     | 422 ++++++++++++++++++
 .../forms/iwo-open-path-disclosure-hold.test.ts    | 470 +++++++++++++++++++++
 __tests__/lib/forms/iwo-refusal-copy.test.ts       |  23 +-
 app/api/documents/[id]/route.ts                    | 100 ++---
 app/api/documents/route.ts                         |  83 +++-
 .../legal-audit/illinois-court-forms-manifest.json |   4 +-
 docs/legal-audit/iwo-copy-approval-ledger.md       |  78 ++++
 .../iwo-omb-renewal-transition-2026-09-01.md       | 275 ++++++++++++
 ...pen-path-disclosure-copy-decision-2026-09-05.md | 109 +++++
 lib/counties/county-iwo-workflow.ts                |  54 ++-
 lib/documents/package-handler.ts                   |  34 +-
 lib/documents/serve-document-handler.ts            | 200 +++++++++
 lib/forms/court-forms-read-model.ts                |   4 +
 lib/forms/illinois-court-forms.ts                  |   4 +-
 lib/forms/iwo-distribution-hold.ts                 |  93 ++++
 lib/forms/iwo-package-guard.ts                     |  48 ++-
 lib/forms/iwo-provenance.ts                        | 221 ++++++++--
 lib/forms/iwo-refusal-copy.ts                      |  44 +-
 lib/forms/iwo-route-factory.ts                     |   7 +
 lib/forms/official-artifact-access.ts              |  82 +++-
 reports/cc/fs-iwo-pr2a-omb-transition-20260901.md  | 452 ++++++++++++++++++++
 29 files changed, 3846 insertions(+), 180 deletions(-)
```

Rather than trust any of the three tables above — a diffstat inside the diff it
describes goes stale the moment anything else lands — reproduce them:

```
git diff --stat c84e9a7cfb09a4e6aa68906383afa578e9691ce2..HEAD
git log --oneline c84e9a7cfb09a4e6aa68906383afa578e9691ce2..HEAD
git show --stat ef5a3be
git show --stat d1a2005
```

Every path is inside the allowlist. No file outside it was modified. **No
dependency, Prisma/database, `public/forms`, PDF artifact, mapping, unrelated
county policy, or customer-copy file was touched.**

`app/api/documents/route.ts` and `app/api/documents/[id]/route.ts` were added to
the touched set by `d1a2005` (§3.2). Both are IWO read boundaries, but they are
**not** IWO-only files, and this report will not claim the change is invisible to
non-IWO rows. The observable deltas for a non-IWO document are, in full:

1. **The listing no longer returns `content`.** It previously returned whole
   `Document` rows, base64 payload included; it now selects and re-projects six
   metadata fields. Any consumer that read `content` off `/api/documents` loses
   it — deliberate, and the point of the change (§3.2). The dashboard renders
   only the six.
2. **Whitespace-only `content` is now the pre-existing 404** instead of being
   served as a body. Same 404, same copy, wider condition
   (`!content || content.trim().length === 0`).
3. **An undecodable base64 PDF is now that same 404** instead of a `200` with a
   zero-byte body. `Buffer.from` is lenient and does not throw, so the old path
   handed the browser an empty "PDF" that fails to open.
4. **The ownership-failure `403` now carries `no-store`.** Body and status
   unchanged.
5. A verbose per-request `console.log` of document metadata was removed.

No copy string was added or changed on any of these paths; 2 and 3 reuse the
existing 404 text verbatim. Nothing here touches pricing, payment, schema, env,
or dependencies.

## 3. The model implemented

One `expiration` field carried three different facts and was used as the
operative cutoff. It is retired and split:

| Fact                                | Field                              | Value        | Governs                                                              |
| ----------------------------------- | ---------------------------------- | ------------ | -------------------------------------------------------------------- |
| Printed legacy-PDF date             | `printedLegacyPdfDate`             | `2026-08-31` | Nothing — display metadata                                           |
| OIRA collection approval expiration | `collectionApprovalExpiresOn`      | `2029-08-31` | When a renewal review is next due                                    |
| Legacy-form transition end          | `legacyTransitionFirstBlockedDate` | `2027-08-25` | **The operative cutoff**, whole-day fail closed in `America/Chicago` |

**The public vocabulary is exactly these three names**, per the frozen acceptance
sheet §5. No ambiguous alias survives anywhere — provenance, validation, reporting
output, docs, tests, and this report all use them. No internal compatibility
mapping was introduced, because no real contract required one: every consumer of
the retired names is inside this allowlist. `PINNED_OIRA_APPROVAL` previously
carried the same 2029 date under a second name (`collectionExpiration`); it now
uses `collectionApprovalExpiresOn` too, so one fact has one name. The Notice of
Action prints that date under the label "Expiration"; the field comment records
that without reproducing the ambiguous label as an identifier.

The cutoff field is named **first blocked date**, not "end": an "end date" reads
as either the last allowed day or the first disallowed one, and a gate cannot be
ambiguous about which. The last ALLOWED day is `2027-08-24`; the last allowed
instant is `2027-08-25T04:59:59.999Z`. The derived surfaces carry the same
semantics — `IwoValidation.legacyTransitionBlocked` and
`IwoValidation.daysToLegacyTransitionFirstBlockedDate` — and
`describeIwoProvenance()` surfaces `printedLegacyPdfDate`,
`collectionApprovalExpiresOn`, `legacyTransitionFirstBlockedDate`,
`transitionTimeZone`, `oiraApproval`, and `renewal`, with no single ambiguous
`expiration` key.

Pinned in `PINNED_OIRA_APPROVAL`: ICR `202607-0970-002`, action
`approved_without_change`, approval date `2026-08-25`, collection expiration
`2029-08-31`, NOA `https://www.reginfo.gov/public/do/DownloadNOA?requestID=1826353`
(97,827 bytes, SHA-256 `c2b68202cf4741b0f0a811457e40e6470b1fadce4a3a2f781e5dcb6b2c0df652`).
`PINNED_RENEWAL_EVIDENCE` is `confirmed`, reviewed `2026-09-01`.

Three properties are enforced by test, not by comment:

- The printed date **never** acts as the operative collection expiration, and no
  longer closes the gate on its own.
- The 2029 collection approval **never** authorizes the legacy PDF past
  `2027-08-25`.
- A confirmed renewal is **never** reported as pending. The renewal-review window
  is measured against the collection expiration, not the transition end —
  measuring it against the transition end would have re-introduced a false
  "under renewal review" claim from 2027-06-26 onward.

`2027-08-25` is derived (one year from the OIRA approval date), not published. A
third party's `August 31, 2027` wording was deliberately **not** adopted. Re-pin
only against an explicit ACF implementation notice.

### Copy

**One approved user-visible string was changed, on owner instruction.** The four
operative refusal codes and their fail-closed precedence are unchanged; three of
the four copy blocks are untouched.

`federal_form_authority_expired`, first paragraph — retired:

> …because the period Fresh Start is authorized to distribute the selected
> version has ended.

replaced with:

> …because Fresh Start has stopped distributing the selected version of this
> form.

**Why the change is the safer one.** The retired sentence asserted that an
external authorization period existed and ended. The date that now closes this
gate is `legacyTransitionFirstBlockedDate`, which is **FreshStart's own
conservative derivation** (one year from the OIRA approval date), not a published
ACF expiry — so the old sentence claimed an agency-set fact that no source
states. The replacement describes only Fresh Start's own conduct and asserts
nothing about OMB status, any authorization window, or acceptance.

Both paragraphs are pinned character-for-character, including length, by
`__tests__/lib/forms/iwo-refusal-copy.test.ts` and a dedicated exact-copy block in
`__tests__/lib/forms/iwo-omb-transition.test.ts`, which also assert the retired
sentence is gone and that the copy matches none of
`/authoriz/`, `/expir/`, `/period/`, `/renewal/`, `/OMB (has|approved|extended)/`,
`/no longer (valid|current)/`.

**Approval state, stated exactly once so it cannot drift.** The change was made
on product-owner instruction of 2026-09-01. It has **no approval of record**: no
entry has been written in the owner-held durable ledger
`OWNER-COPY-APPROVAL-20260824.md`, which is outside this repository. This report
does not claim the string is re-approved, and neither does the module header of
`lib/forms/iwo-refusal-copy.ts`. The single in-branch authority on the status is
`docs/legal-audit/iwo-copy-approval-ledger.md`, Entry 1, which reads
`PENDING — REQUESTED, NOT APPROVED`.

That is a different item from the **open-path disclosure** copy (Entry 2 of the
same ledger, §3.1 below): Entry 1 is a shipped, owner-directed string awaiting
its durable record; Entry 2 is copy that does not yet exist and is not wired.

**Owner action required:** log this supersession against
`OWNER-COPY-APPROVAL-20260824.md`. The module header records the supersession and
its reason inline, so the owner-doc entry has its exact source text.

- `federal_form_authority_expired` — now driven by
  `legacyTransitionFirstBlockedDate` instead of the printed date, and re-worded as
  above.
- `federal_form_renewal_pending` — now **unreachable from pinned evidence**. Kept
  deliberately: it is written in the past tense about Fresh Start's own record, so
  it stays truthful if a future review re-pins renewal to `pending`, and deleting
  it would require re-approving copy to get it back. Tests still reach it by
  injecting pending evidence.

## 3.1 Commit `ef5a3be` — the global open-path disclosure hold

This is the largest behavioral change in the branch, and §3 above does not
describe it: §3 was written at `2e165d2` and stops there.

**What it does.** Gates 1–5 of `getIwoAvailability` only ever governed
*refusals*. On the SUCCESSFUL path a customer received the legacy ACF print —
which carries a now-past date on its face and for which an approved revised
successor exists — and was told nothing. `ef5a3be` adds **gate 6**: the exact
disclosure for that successful path must be owner-approved, and it is not.

**What it is not.** It is not an expiry, an OMB status, a renewal state, or an
agency action. The pinned federal evidence is untouched: OIRA concluded ICR
`202607-0970-002` on `2026-08-25`, approved without change through `2029-08-31`;
the legacy print's transition boundary is still `2027-08-25`; the on-disk bytes
still match the pinned SHA-256. `lib/forms/iwo-distribution-hold.ts` says this in
its first paragraph and no code, comment, log line, refusal code, or
user-visible string in this branch describes it otherwise.

| | |
| --- | --- |
| Refusal identity | `open_path_disclosure_unapproved` |
| Pinned state | `PINNED_OPEN_PATH_DISCLOSURE_APPROVAL.status = "pending"` (`lib/forms/iwo-distribution-hold.ts`) |
| Fail-closed on | anything that is not an explicit `"approved"`, **including `undefined`** |
| Override surface | **none** — no env var, no runtime toggle, no product entry point that accepts one |
| How it clears | owner approves one exact variant → it is added to the approved-copy module with a ledger entry → `status` moves to `approved` **in the same change** |

**Gate 6 is last on purpose.** A genuine county or artifact problem still reports
its own truthful, approved cause; the hold only closes the outcome that would
otherwise have been OPEN.

**It carries no copy, anywhere, on purpose.** Inventing wording here would be
shipping unapproved customer-facing legal-adjacent text; borrowing another
cause's approved sentence would misapply an approval granted for a different
cause *and* state something untrue, since under the hold nothing is expired,
missing, mismatched, or under renewal review. So every held surface says nothing:

- `getIwoAvailability` returns `copy: []` and `requiresManualReview: false` —
  this is a global release decision, not a per-case referral
  (`lib/forms/official-artifact-access.ts`).
- The packet composer adds the reason code and no prose
  (`lib/counties/county-iwo-workflow.ts`). Automatic packet composition is a
  distribution path — the one that puts the legacy print in a customer's hands
  without their asking — so the hold reaches it, not only the download boundary.
- The guarded route refuses with its existing 403, `no-store`, zero PDF bytes
  (`lib/forms/iwo-route-factory.ts`).
- `/legal-info/court-forms` renders the form with no DTO download href and no
  external link (`lib/forms/court-forms-read-model.ts`).

**The proposed wording is unapproved and unwired.** The draft variants live in
`docs/legal-audit/iwo-open-path-disclosure-copy-decision-2026-09-05.md`, and
`__tests__/lib/forms/iwo-open-path-disclosure-hold.test.ts` asserts that **no
variant appears in any shipped copy surface**, under either approval state. The
pending item is Entry 2 of `docs/legal-audit/iwo-copy-approval-ledger.md` — see
the approval-state paragraph in §3, which distinguishes it from Entry 1.

**Catalog/manifest reconciliation in the same commit.** The IWO's `officialUrl`
in `lib/forms/illinois-court-forms.ts` and
`docs/legal-audit/illinois-court-forms-manifest.json` was moved to the retrieved
`acf.gov/…?download=1` address, and the version label `printed expiration
2026-08-31` became `printed date 2026-08-31` — the "expiration" label is exactly
the ambiguity PR-2A retired. Asserted by test; see §9.5.

## 3.2 Commit `d1a2005` — the legacy `Document` read boundaries

`Document` rows are free-form and long-lived. A row created before any of this
existed can name the federal IWO, and two read paths never consulted the gate.
`d1a2005` closes both, and adds `lib/documents/serve-document-handler.ts` (new,
~200 lines) so the direct-serve boundary is a dependency-injected factory whose
branches can be exercised against the REAL handler without a database or a
session.

| Surface | Boundary | Behavior when the gate is closed |
| --- | --- | --- |
| `GET /api/documents` (list) | `app/api/documents/route.ts` | The IWO-classified row is **omitted outright**. No refusal identity, no explanatory copy — a listing is not the surface that would carry a disclosure even if one existed. |
| `GET /api/documents/[id]` (direct bytes) | `lib/documents/serve-document-handler.ts`, wired by `app/api/documents/[id]/route.ts` | Generic 403 + `no-store`, zero bytes. |
| `POST /api/documents/package` (ZIP) | `lib/documents/package-handler.ts` | Row excluded from the archive; under the hold **no** `00_WITHHELD_ITEMS.txt` entry is written at all. |

**The listing carries no bytes by construction, twice over.** `LIST_FIELDS` does
not select the `content` column, and `toListRow` re-projects at the
serialization boundary — so a widened select or a helper returning the whole
record still cannot carry `content` out. "We did not ask for it" is a weaker
guarantee than "we do not emit it"; both are in place. The availability gate is
consulted **only** when an IWO-classified row is actually present, so ordinary
listings do not take on a second query.

**Policy authorizes the form; it never authorizes the bytes.** The new exported
`isIwoReleaseOpen` (`lib/forms/iwo-package-guard.ts`) is *policy only* — the same
Gate 1 the packager applies, reached through the same `iwoPolicyAvailability`
helper and the same authoritative stored county, so the three surfaces cannot
drift apart. Any caller that then emits stored bytes must **also** run
`validateIwoPayload`, and the direct-serve path does: strict base64 round-trip,
exact `505412` bytes, exact SHA-256 `2b15c02a…b551`, `application/pdf`. A row
that merely *names* the instrument while holding a different, truncated, empty,
or undecodable payload is refused rather than released as the federal form. The
rejection reason is internal and deliberately not surfaced.

**Ordering.** Ownership is checked *before* the IWO gate on the direct-serve
path, so the gate leaks nothing to a non-owner. The refusal is the same 403 body
the route already returned for an ownership failure — it carries no cause, no
blocker list, and no refusal identity, because the gate can close for the
disclosure hold, which has no approved wording at all.

**The ZIP's withheld notice.** `package-handler.ts` now distinguishes the hold
from a payload rejection: under the hold, `00_WITHHELD_ITEMS.txt` is suppressed
entirely rather than falling back to the federal-mismatch sentence, which would
be **false** here (the pinned artifact matches exactly and nothing is expired,
missing, or under renewal review). The generic fallback is now reached only for a
payload rejection, for which it is true.

**Non-blocking, pre-existing.** `package-handler.ts` still writes raw internal
reason tokens (e.g. `county_manual_conditional`, `wrong_sha256`) into the
customer-facing `00_WITHHELD_ITEMS.txt` for the *other* causes. That predates this
branch, is on `main`, and is unreachable under the hold — but it is the one place
an internal identifier can reach a customer artifact. Recorded, not fixed here.
See §9.7.

**Net effect of `ef5a3be` + `d1a2005`.** Every IWO release path — direct
download, package ZIP, direct document read, document listing, generate, county
packet auto-composition, and the public court-forms page — funnels through
`getIwoAvailability`, and the pinned hold closes it. **Zero IWO bytes are
distributable on this candidate through any surface.** The failure mode of this
branch is over-withholding, not leakage.

## 4. Preserved behavior — asserted, not assumed

- **PDF bytes and mapping unchanged.** `private/official-forms/income-withholding-order.pdf` is byte-identical: SHA-256 `2b15c02a…b551`, 505,412 bytes, same path, same MIME, same title/control metadata, same 112-field mapping. `git diff --cached --stat -- private/official-forms/` is empty. The IWO still has zero field mappings and is never filled or generated.
- **Will County stays `manual_conditional`.** No county disposition, lane, or packet-placement behavior changed; `county-iwo-workflow.ts` took comment-only edits. Will's 403 / `no-store` / zero-PDF-bytes refusal path is unchanged and still asserted.
- Missing / wrong-hash / wrong-length / wrong-MIME / invalid-base64 gates and their precedence: preserved and asserted.
- Static artifact 404, unauthenticated 401, guarded 403 with `no-store` and zero PDF bytes, package withholding, dormant-catalog removal, ready-row bypass protection, generate-route refusal: all preserved and asserted.
- Authenticated server-side county resolution unchanged; `?county=` still ignored.

**No test was weakened or deleted to obtain green.** Four tests changed meaning
because the behavior they pinned deliberately changed, and each was re-pointed at
the new operative cause rather than relaxed:

1. Route: "NOT expired at the last allowed instant, though the renewal window independently closes it" → now asserts a **200 with exact pinned bytes** at the last allowed instant, plus a new test that the printed date does not refuse. The old assertion depended on the renewal window being anchored to the printed date.
2. Readiness: "holds while OMB renewal review is pending" → now injects pending evidence explicitly, since pinned evidence is confirmed. Same assertion, same invariant.
3. "pins renewal as evidence, not a caller argument" → still proves a caller cannot clear a pending renewal (pending injected + inert `ombRenewalReview` argument), and additionally asserts pinned evidence is `confirmed`/`2026-09-01`.
4. Statewide counties "withhold the IWO when the federal gate is closed" → the gate is now closed by running the clock past the transition end rather than by leaving renewal pending. Assertions unchanged.

One test was **added** that the previous suite could not express: the gate can
actually reach `READY` on confirmed evidence inside the transition window. That
is not a legal-acceptance conclusion.

## 5. Verification results

| Check              | Command                       | Result                                                                                                |
| ------------------ | ----------------------------- | ----------------------------------------------------------------------------------------------------- |
| Focused, normal    | `jest` × 6 suites             | **6 suites / 291 tests passed**, exit 0                                                               |
| Focused, serial    | `jest --runInBand` × 6 suites | **6 suites / 291 tests passed**, exit 0                                                               |
| Full suite, normal | `jest`                        | **62 passed, 5 skipped of 67 suites; 875 passed, 34 skipped of 909 tests**, exit 0                    |
| Full suite, serial | `jest --runInBand`            | **62 passed, 5 skipped of 67 suites; 875 passed, 34 skipped of 909 tests**, exit 0                    |
| Production build   | `next build`                  | **exit 0**, 126/126 static pages                                                                      |
| Type check         | `tsc --noEmit`                | **exit 0, zero errors**                                                                               |
| Lint               | `eslint .`                    | 560 problems (398 errors, 162 warnings) — **identical at base and on the candidate**; zero regression |
| Format             | `prettier --check .`          | 524 dirty files at base → **524** on the candidate; **zero delta**                                    |
| Whitespace         | `git diff --check`            | **clean, exit 0**                                                                                     |

Focused suites: `__tests__/lib/forms/iwo-omb-transition.test.ts` (new),
`__tests__/lib/forms/iwo-refusal-copy.test.ts`,
`__tests__/lib/counties/will-iwo-conditional.test.ts`,
`__tests__/api/forms-iwo-route.test.ts`,
`__tests__/api/documents-generate-iwo-deny.test.ts`,
`__tests__/api/documents-package-iwo.test.ts`.

Boundary coverage for `2027-08-25` in `America/Chicago`: the final millisecond
before cutoff (`2027-08-25T04:59:59.999Z` → open, exact bytes served), the first
disallowed instant (`2027-08-25T05:00:00Z` → `federal_iwo_expired`), the last UTC
instant of the cutoff day (`2027-08-25T23:59:59Z` → still closed, proving the
whole-day Chicago rule), and the following day.

### Two pre-existing conditions, stated plainly

**`eslint .` and `prettier --check .` do not pass on this repository, and did not
pass at the pinned base.** Both were run against the base with the candidate
stashed, to separate pre-existing failure from regression:

- ESLint: `560 problems (398 errors, 162 warnings)` at base and `560 problems
(398 errors, 162 warnings)` on the candidate — byte-identical totals. The only
  ESLint error inside the allowlist is a pre-existing `no-explicit-any` at
  `__tests__/api/documents-generate-iwo-deny.test.ts:44`, untouched by this
  change.
- Prettier: **all nine** pre-existing allowlisted files were already
  Prettier-dirty at the base commit and are left exactly as they were. Repo-wide
  the candidate is **524 dirty files, the same as base — zero delta.**

Scoped format check on every file this amendment touched: the four pre-existing
allowlisted files (`iwo-provenance.ts`, `iwo-refusal-copy.ts`,
`official-artifact-access.ts`, `will-iwo-conditional.test.ts`) remain dirty
exactly as they were at base and were **not** reformatted; the report was
re-formatted after editing, so all three slice-created files stay clean.

The three files this slice _creates_ are Prettier-clean:
`__tests__/lib/forms/iwo-omb-transition.test.ts`,
`docs/legal-audit/iwo-omb-renewal-transition-2026-09-01.md`, and this report.

**Scope note.** The amendment asked for the new test file only, on a 524 → 525
count. That count was measured before the overlay and this report existed; with
all three new files present the candidate was 524 → **527**. Formatting the test
file alone would have left +2. All three new files were therefore formatted, to
meet the stated goal of adding no new Prettier failure. The two Markdown files
were verified token-by-token before and after: **identical word sequences**
(1,507 and 2,254 words), with changes confined to table-separator padding and one
`*webpage*` → `_webpage_` emphasis marker. Say the word and the two Markdown
files revert.

**No pre-existing file was reformatted.** Reformatting the nine untouched
allowlisted files remains out of scope: it would bury the substantive diff and is
the owner's call.

### Environment note

The worktree had no `node_modules`. Rather than install, `node_modules` was
symlinked to the adjacent worktree's (identical `package.json` **and**
`package-lock.json` — both hash-compared before linking). `node_modules` is
gitignored and is not in the commit. `prisma generate` was **not** run, because
it would write into that shared directory; the existing generated client was used
and the build passed with it. `next build` was run directly instead of
`npm run build` for that reason — the only deviation from the repository's own
command, and the schema is byte-identical either way.

## 6. Evidence overlay

`docs/legal-audit/iwo-omb-renewal-transition-2026-09-01.md` is **additive**. No
frozen July/August evidence was rewritten or deleted. It records: the OIRA/NOA
identity and hashes; the one-year transition basis and the conservative
`2027-08-25` derivation together with the rejected third-party `2027-08-31`
wording; the current ACF artifact hash and byte length; the revised successor
being **DOCX-only and not shippable**; Illinois still linking the legacy
artifact; Will's unchanged manual/conditional status; and the later WAF
challenge.

Dynamic webpage hashes (the Reginfo ICR page, the Illinois Courts page) are
labelled **non-durable audit-response identifiers**, not authority pins —
Reginfo injects per-session `jsessionid`/CSRF values and the Illinois page
carries changing view-state, so repeated GETs of unchanged records yield
different whole-body hashes.

The overlay explicitly states that the later WAF response **does not disprove**
the earlier exact PDF retrieval, and records the 2026-09-01 `HTTP 200` retrieval
receipt that discharges the fresh-retrieval gate.

## 7. Artifact-gate status and residual release gates

### The branch-cut artifact evidence is SATISFIED

The fresh exact-retrieval blocker recorded against the first candidate is
**cleared**. An official queryless ACF retrieval was performed on 2026-09-01 at
approximately 12:00 CDT, after `bc450e8`:

- URL `https://acf.gov/sites/default/files/documents/ocse/omb_0970_0154.pdf?download=1`
- **`HTTP 200`**, `Content-Type: application/pdf`
- **505,412 bytes**
- SHA-256 **`2b15c02a46b66a7d0fa2bd80d4644d5d6d5e6798911225f8e0272b45fe20b551`**
- Exact match to the pinned 4-page, 112-field legacy ACF artifact.

Receipt of record:
`handoffs/cc-reviews-20260901/fs-acf-retrieval-receipt-20260901.md`.

**The branch-cut retrieval named in the packet's §5 checklist is therefore no
longer outstanding.** Earlier text in this report that said otherwise was written
before the retrieval existed and is retired.

### The later WAF challenges do not undo it

Two subsequent checks — including the independent review after `f2a2330` —
returned the **AWS WAF `HTTP 202` challenge with zero PDF bytes**. A WAF
interstitial is a statement about the request, not about the document. It does
**not** invalidate the captured `HTTP 200` branch-cut evidence above, and this
report does not treat it as doing so. Equally, the challenge is not itself
evidence of continuity: the receipt above is what discharges that gate.

### What release is still held on

> **LOCAL CANDIDATE ONLY / RELEASE HELD** — not for want of artifact evidence,
> but pending independent exact-SHA acceptance of this tree and the later
> explicit release gates (push/PR, Preview and live-like smokes, merge,
> Production). Those are gates 2–6 of the packet's §7 and none of them is
> satisfied by this commit.

The artifact gate would re-open only if ACF bytes drift: the exact hash gate
refuses on drift by design, and the response is to investigate and prepare PR-2B
or a new evidence repin — never an auto-update.

Rollback is code-only and immediate: revert this commit and the released baseline
resumes refusing the IWO for every county. No data migration or artifact
replacement is involved.

## 8. Side-effect ledger

**No push, PR, merge, deploy, Vercel change, Production mutation, Preview
deployment, database, payment, customer, provider, court, public, credential, or
destructive action occurred.**

- Remote access was read-only: `git ls-remote` and `git fetch --no-tags`. No ref
  was created, moved, or deleted on the remote.
- Writes were confined to the new isolated worktree. The primary checkout and
  every other existing worktree were left untouched (`node_modules` was read
  through a symlink; no tracked file in another worktree was read or written).
- All commits on this branch remain local only.
- No network retrieval of official sources was performed by this session.

## 9. Open items for the owner

1. **Adopt or correct `2027-08-25`.** It is a conservative derivation, not a
   published ACF date. This is approval gate 1 in the packet and it is not
   satisfied by this commit.
2. ~~Run the branch-cut ACF retrieval.~~ **Done** — `HTTP 200`, exact pinned hash
   and length, 2026-09-01 (§7). No longer an open item.
3. **Log the copy re-approval — SEPARATE OWNER-DOC STEP, deliberately not done
   here.** The `federal_form_authority_expired` first paragraph was replaced on
   owner instruction of 2026-09-01 (§3). The durable ledger
   `OWNER-COPY-APPROVAL-20260824.md` is **outside this branch's allowlist**, and
   this branch was not widened to reach it. The supersession, the retired
   sentence, and the reason are recorded inline in the
   `lib/forms/iwo-refusal-copy.ts` header and in §3 of this report, so the
   owner-doc update has its exact source text. It remains an open owner action.
4. **Decide on the pre-existing lint/format state** (§5). The nine untouched
   allowlisted files are still Prettier-dirty, exactly as at base.
5. ~~`IWO_PROVENANCE.canonicalUrl` still points at the `acf.hhs.gov` host.~~
   **No longer true of this tree — closed at `0f0e371`.** The constant was
   reconciled to the address that was actually retrieved,
   `https://acf.gov/sites/default/files/documents/ocse/omb_0970_0154.pdf?download=1`
   (`lib/forms/iwo-provenance.ts`), and the catalog
   (`lib/forms/illinois-court-forms.ts`) and manifest
   (`docs/legal-audit/illinois-court-forms-manifest.json`) name the same URL, so
   one document has one address in all three places. A test asserts the
   three-way match (`__tests__/lib/forms/iwo-omb-transition.test.ts`, "names one
   URL, in all three places"). Nothing new is asserted about the old host: the
   2026-07-21 provenance JSON already records `www.acf.hhs.gov` resolving by 301
   to `acf.gov`, and no fetch was performed to make the change. Verify on any
   tree with:

   ```
   grep -rn 'omb_0970_0154.pdf' lib/forms/iwo-provenance.ts lib/forms/illinois-court-forms.ts docs/legal-audit/illinois-court-forms-manifest.json
   ```

   Left as a struck item rather than deleted so a reader of an earlier revision
   of this report can see it was resolved, not dropped.
6. Independent exact-SHA evidence/security review of this tree, then Preview
   smokes, remain gates 2–6 in the packet. None are satisfied by this commit.
