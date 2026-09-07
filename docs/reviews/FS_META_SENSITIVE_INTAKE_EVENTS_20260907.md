# Meta Pixel — sensitive intake events

**Date:** 2026-09-07
**Branch:** `rex/fs-sensitive-meta-intake-20260907`
**Parent (reviewed candidate):** `443343566ff79e4acb343fc06295f868fb4428bd`
**Status:** implemented, verified locally, not pushed

This file documents the commit that contains it. It supersedes the parent
candidate, which was BLOCKed on independent review.

---

## 1. The block

The parent candidate removed the two questionnaire Meta dispatches and its
message then stated:

> …as are the permitted account/commerce Meta events (Lead, InitiateCheckout,
> StartTrial).

That enumeration was false at the SHA it described. `lib/analytics/events.ts`
at `4433435` still contained two more Meta dispatches, both of them intake
signals of exactly the kind the commit claimed to be removing:

| Helper | Meta call | Payload |
|---|---|---|
| `analytics.documentGenerate` | `trackMetaCustomEvent('DocumentGenerate', …)` | `{ document_type }` |
| `analytics.prenupDocumentUpload` | `trackMetaCustomEvent('PrenupDocumentUpload', …)` | `{ document_type }` |

So the pixel was still told that a given browser had generated a court document
(`petition`, `parenting_plan`, …) and had uploaded a prenuptial or postnuptial
agreement. Both are case facts, not viewed activity. The published privacy copy
(`app/privacy/page.tsx`) scopes usage data to "pages visited, clicks" and states
"We don't share your case data with marketing partners."

The `prenupDocumentUpload` case was the worst of the two. When the caller omits
`fileSize`, the GA4 payload contains `file_size: undefined`, which is not a safe
scalar, so `sanitizeClientEventParams` returns `null` and the whole first-party
event is dropped. Meta was therefore the **only** recipient of that signal.

## 2. What changed

`lib/analytics/events.ts` — the two `trackMetaCustomEvent` calls removed, the
import narrowed to `trackMetaEvent`, and a short rationale added to each
helper's docblock matching the wording already on `questionnaireStart`. No
other dispatch was touched; no GA4 event name, parameter, or value changed.

`__tests__/lib/analytics/meta-sensitive-events.test.ts` — extended.

Net effect: `lib/analytics/events.ts` now dispatches **no Meta custom event at
all**. Every Meta custom event it has ever carried was an intake signal.

## 3. RED → GREEN

Strict order: tests written first, run against the unmodified parent module,
then the module changed.

**RED** (final test file, pre-change `lib/analytics/events.ts` restored from
`HEAD`) — `9 failed, 9 passed, 18 total`:

```
✕ documentGenerate keeps its exact GA4 payload and sends nothing to Meta
✕ documentGenerate for an unofficial form is equally invisible to Meta
✕ prenupDocumentUpload keeps its exact GA4 payload and sends nothing to Meta
✕ prenupDocumentUpload with no file size reaches neither transport
✕ a full document journey leaks no signal to Meta
✕ emits only the permitted Meta events when every helper is driven
✕ keeps the removed document and upload Meta event names out of the events module
✕ dispatches no Meta custom event at all from the events module
✕ enumerates exactly the permitted Meta event names in source
```

**GREEN** after the removal — `18 passed, 18 total`; the whole analytics
directory `94 passed, 94 total` across 7 suites.

### Why "GA4 unchanged" is an observation, not a claim

Each positive control asserts the first-party payload **before** the Meta
payload. In the RED run every one of those tests failed on its `fbqCalls()`
line — `137`, `146`, `158`, `169`, `179` — with the preceding GA4 assertions
passing. The byte-level assertions

```
'[["event","document_generate",{"document_type":"petition","is_official_form":true}]]'
'[["event","prenup_document_upload",{"document_type":"prenup","file_size":482113}]]'
```

therefore held against the pre-change module and still hold after it. The
removal provably did not perturb the first-party payloads.

## 4. Source-lock coverage

The parent locked two event-name strings out of the module. That is not enough
to keep an enumeration honest — it can only catch names someone already thought
to list. The lock is now three-layered:

1. **Name lock** — `DocumentGenerate` and `PrenupDocumentUpload` must not appear
   in the module source (the questionnaire pair is still locked separately).
2. **Mechanism lock** — the string `trackMetaCustomEvent` must not appear in the
   module at all, so re-adding a custom Meta event is a deliberate act rather
   than an incremental line.
3. **Exhaustive enumeration** — every `trackMeta(Custom)?Event('X'` in the
   module source is extracted and compared against
   `["InitiateCheckout", "Lead", "StartTrial"]`, and separately **every one of
   the 28 exported `analytics` helpers is driven at runtime with the gate open**
   and the resulting `fbq` calls compared against the same list.

The runtime driver is typed `Record<keyof typeof analytics, () => void>`, so
`tsc` fails if a helper is added without a decision about its Meta exposure.
The claim "the permitted Meta surface is Lead / InitiateCheckout / StartTrial"
is now machine-checked in two independent ways rather than asserted in prose.

## 5. Verification

| Check | Result |
|---|---|
| `npx jest __tests__/lib/analytics/` | 7 suites, **94 passed**, 0 failed |
| `npx jest` (full) | 78 suites — **73 passed, 5 skipped**; **1069 passed**, 34 skipped, 0 failed |
| `npm run type-check` | clean, exit 0 |
| `npm run build` | compiled successfully, 126/126 static pages, exit 0 |
| `npx eslint` on both changed files | test file clean; `events.ts` reports only the 2 pre-existing `no-explicit-any` errors on untouched lines 30/51 |
| Secret scan of the diff | no credential-shaped strings, no high-entropy literals |
| Scope | 2 files modified + this report; no legal copy, env, DB, or provider changes |

The 5 skipped suites are the DB-backed integration tests. There is no
`.env`/`.env.local` in this worktree (tracked DB credentials were removed in
`648b9a8`), so `DATABASE_URL` is unset and those suites skip. That is the
pre-existing baseline, not an effect of this change.

Lint is not a gate in this repo — `npx eslint .` reports 404 pre-existing errors
repo-wide, and the husky `pre-commit` hook runs `npm test`. The four
`no-require-imports` errors that the parent introduced in the boundary test were
nonetheless removed by hoisting the source-lock file read to a single top-level
`node:fs` / `node:path` import shared by all four locks.

## 6. Scope boundaries — what this does not do

- **No legal copy was edited.** `app/privacy/page.tsx` and
  `app/legal-info/privacy/page.tsx` are untouched. The change moves the code
  toward the copy, not the other way round.
- **Explicit dispatches only.** `components/analytics/meta-pixel.tsx` still
  fires `fbq('init', …)` and `fbq('track', 'PageView')` when the pixel mounts.
  Any collection Meta performs automatically from the loaded pixel (automatic
  advanced matching, automatic event detection) is a dashboard-side setting and
  is not governed by this code or by these tests.
- **No push, PR, merge, or deploy.** The commit is local to this worktree.

## 7. Observations left for the owner (not fixed here)

1. **`documentDownload` drops its GA4 event.** It passes `file_name`, which is
   not in `SAFE_TOKEN_KEYS`, so `sanitizeClientEventParams` returns `null` and
   nothing is sent. Asserted as current behavior in "a full document journey"
   (4 of 5 calls land). If document downloads are supposed to be measurable,
   that helper needs a bounded parameter — this is a measurement gap, not a
   privacy one.
2. **`prenupDocumentUpload` without `fileSize` still measures nothing.** Same
   sanitizer mechanism. Now that Meta no longer receives it, this milestone is
   invisible on that path. The fix is a bounded param, not a wider payload.
3. **`analytics.search` and `analytics.error` are likewise dropped by the
   sanitizer** (`search_term`, `error_type`, `error_message`, `error_context`
   are not safe keys). Deliberate-looking, but worth confirming.
4. **The three permitted Meta events remain unreviewed on their merits.**
   `Lead`, `InitiateCheckout`, and `StartTrial` were treated as permitted here
   because the parent candidate treated them so; this work did not re-examine
   whether a divorce-service `Lead` or `InitiateCheckout` is itself a sensitive
   disclosure. If that ruling changes, `PERMITTED_META_EVENTS` in the boundary
   test is the single place to change.
