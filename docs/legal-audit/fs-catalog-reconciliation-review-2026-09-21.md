# FreshStart Illinois form-catalog reconciliation — review and remediation

**Review date:** 2026-09-21
**Branch:** `rex/fs-catalog-reconcile-20260921` (base `d381035` + catalog commit `3332447`)
**Scope:** `lib/forms/illinois-court-forms.ts`, its manifest, the offline verifier, and the packet
composition that consumes the catalog.
**Disposition:** **NO UNPAUSE.** Every affected generation, download, and filing-readiness lane stays
fail-closed. This is an evidence and remediation record, not a release approval and not legal advice.

---

## 1. What this review did

It reviewed the catalog-reconciliation candidate produced from the 2026-09-14 evidence packet
(`fs-form-artifact-reconciliation-2026-09-14.md`), closed three defects found in it, and recorded the
limits of what could be verified. It did **not** touch questionnaire mapping or form generation.

The Claude reviewer could not execute commands or network fetches. Rex subsequently performed the
controller verification recorded in §6.5: official-suite readback, byte/hash retrieval of all 17
official URLs, the offline verifier, and the focused catalog/IWO tests. Typecheck and build results
are recorded separately in the release evidence; none of these checks is release or unpause authority.

---

## 2. Official sources of record

| Source | URL |
|---|---|
| Illinois Courts — Divorce / Child Support / Maintenance suite | <https://www.illinoiscourts.gov/documents-and-forms/approved-forms/circuit-court-standardized-forms-suites/divorce-child-support-maintenance/> |
| Illinois Courts — Financial Affidavit suite | <https://www.illinoiscourts.gov/documents-and-forms/approved-forms/circuit-court-standardized-forms-suites/financial-affidavit/> |
| Illinois Courts artifact host (direct PDFs) | `https://ilcourtsaudio.blob.core.windows.net/antilles-resources/resources/…` |
| Federal IWO, address of record for this branch | <https://acf.gov/sites/default/files/documents/ocse/omb_0970_0154.pdf?download=1> |

**Address discrepancy, left as-is.** The 2026-09-14 packet cites the federal IWO canonical endpoint as
`https://www.acf.hhs.gov/sites/default/files/documents/ocse/omb_0970_0154.pdf`. The catalog, the
manifest and `IWO_PROVENANCE` all name the `acf.gov` address instead, which is the address the PR-2A
OMB-transition evidence (`iwo-omb-renewal-transition-2026-09-01.md` §3.3/§3.4.1/§3.6) actually
retrieved with HTTP 200 and the exact pinned hash. The newer evidence governs and the code was not
changed. The older document was left untouched rather than edited to match. **Open for a ruling:**
whether the two addresses serve the same artifact has not been demonstrated on a single date.

## 3. Observed versions (evidence of record, 2026-09-14)

Divorce-suite forms approved **03/2025**, Financial Affidavit suite **06/2025**, Order for Support
**09/2025**. The official draft-comment page showed no draft forms open for comment. The prior
2026-09-21 run reported no new statewide version drift against this evidence.

Nine forms were byte-pinned with page-1 visual inspection in the 2026-09-14 packet: ATJ 103.4, 105.3,
113.8, 111.5, 108.4, 104.4, 106.2, 129.5, 251.5.

The seven `financial-additional-*` rows were not listed in the 2026-09-14 evidence table. Rex therefore
retrieved all 16 Illinois Courts direct PDFs on 2026-09-21 and compared complete response bytes against
the catalog pins. All 16 matched exact byte length and SHA-256, including ATJ 253.1, 254.3, 255.3,
256.3, 257.3, 258.3, and 259.3. They remain `unmapped` and non-automation-eligible; byte identity does
not prove field mapping or generated-output correctness.

## 4. County watch distinctions

Recorded from the prior 2026-09-21 run; not re-observed here. These are **watch items**, not supported
surfaces — no county artifact is claimed anywhere in the catalog (§5).

| County | Observation |
|---|---|
| Cook | Generic / counter-packet guidance |
| DuPage | Exposes the current statewide PDFs |
| Lake | Local UCCJEA / parenting / e-file steps |
| Will | County dissolution procedures (separate from the standing Will IWO conditional) |
| Kane | Links a legacy Illinois Courts URL |

Kane's legacy link is the one that could mislead a customer toward a superseded artifact. It is a
county-site observation, not a defect in this repository.

## 5. Classification and counts

Every one of the 21 entries carries exactly one of five distinct source classes, declared in
`FORM_AUTHORITY_CLASSES` and enforced by test.

| Class | Count | May name an official artifact |
|---|---|---|
| `illinois_supreme_court` — statewide official | 16 | yes |
| `federal_acf` — federal official | 1 | yes |
| `county_or_non_statewide` — county-issued artifact | **0** | no |
| `freshstart_template` — FreshStart-authored | 1 | no |
| `unverified_identity` — no corroborated official artifact | 3 | no |
| **Total** | **21** | |

By automation status: 9 `artifact_and_mapping_review_required`, 7 `unmapped`, 4 `unsupported`,
1 `separately_guarded`. **None is automation-eligible.**

## 6. Defects found in the candidate, and what was changed

### 6.1 Two different claims were collapsed into one class — **fixed**

The candidate labelled `certificate-of-service`, `affidavit-service-special-process` and
`waiver-service` as `county_or_non_statewide`. The 2026-09-14 finding for all three was that *no
statewide artifact was found* — an absence of evidence. `county_or_non_statewide` is the opposite kind
of statement: an affirmative claim that some county issues the artifact. No such evidence exists for
any of the three.

A fifth class, `unverified_identity`, now carries that distinction and the three rows were moved to
it. `county_or_non_statewide` is retained, defined, and currently **empty** — a county claim must be
earned by county evidence. Row names were changed from "(unsupported identity)" to "(unverified
identity)" to match, on both the catalog and manifest sides.

### 6.2 The federal IWO was the one entry marked automation-eligible — **fixed**

`isFormAutomationEligible` returned true for exactly one status, `separately_guarded`, which is the
IWO's — the most restricted artifact in the repository. Nothing was reachable through it today only
because `getFormPath` checks the IWO's id first and throws. That ordering was the entire safety
margin: relax or relocate that id check and the federal artifact resolves to the public static path
`/forms/income-withholding-order.pdf`.

Eligibility is now an explicitly empty allowlist of statuses, so `getFormPath` throws for all 21
entries and `isFormAutomationEligible` is false for all 21, the IWO included. Both existing refusal
messages are unchanged, and the IWO keeps its own distinct "no static path" refusal ahead of the
generic one.

### 6.3 Unverified identities were still composed into packets — **fixed**

`getOpeningPacketForms` / `getProveUpPacketForms` build from `getFormsForCaseType`, which returns
every catalog row matching the case type. Only the IWO was filtered. All four `unsupported` rows are
`requiredFor: ["both"]`, so **each one was being placed into every opening packet** — and
`marital-settlement-agreement` into every prove-up packet — purely on catalog presence. Automatic
packet composition is a generation / filing-readiness path, so this contradicted the candidate's own
stated invariant.

Composition now settles identity before any county or federal gate: rows whose class cannot name an
official artifact are withheld and reported on a new `CountyPacket.withheldUnverified` field.
Corroborated statewide artifacts remain composable — their open question is field mapping, not
identity — and the IWO's separate gate is untouched. The withheld rows deliberately do **not** go
through `deferred`, which carries the IWO's disposition and reason-code vocabulary; conflating a
catalog-identity gap with the federal artifact gate is exactly the merge this review is undoing.

### 6.4 Verifier reported clean on a failing run — **fixed**

`metadataMismatches` fails the `ok` flag but was never rendered into the generated freshness report,
so an authority or provenance drift produced a report with no warning in it. It is rendered now. The
diff also now compares `name`, the customer-visible identity claim — a row renamed on one side only
(quietly dropping an "(unverified identity)" qualifier, say) previously passed. The per-form table
gained authority, automation status, printed code/revision, bytes and a SHA-256 prefix.

The generator's notes claimed the pinned URLs were suite index pages; they are direct PDFs as of
2026-09-14. Both the generator's notes and the hand-written `ILLINOIS_FORMS_FRESHNESS.md` were
corrected, and the stale `pnpm` invocations there replaced with the `npm` scripts that exist.

### 6.5 Rex controller verification — **passed with federal transport warning**

- Official Illinois Courts suite readback showed divorce forms approved 03/2025, Financial Affidavit
  forms approved 06/2025, and Order for Support approved 09/2025.
- Full-byte retrieval checked 17 official URLs: all 16 Illinois Courts PDFs returned HTTP 200 and
  matched the catalog byte count and SHA-256 exactly.
- The federal IWO endpoint returned HTTP 202 with an empty HTML response. This is recorded only as a
  transport warning; its pinned PDF bytes were not re-corroborated and no drift conclusion was made.
- Durable machine-readable receipt:
  `/Users/abigailclaw/.openclaw/workspace/rex/ops/fs-catalog-byte-verification-20260921.json`.
- `npm run forms:verify:offline`: PASS, 21 catalog entries matched 21 manifest entries.
- Focused Jest: PASS, 4 suites / 99 tests (`verify-illinois-forms`, source classification,
  packet withholding, and IWO route).
- Full Jest: PASS, 75 suites / 1,096 tests; 5 suites / 34 tests skipped by the repository.
- `npx tsc --noEmit`: PASS. `npm run build`: PASS, 126 routes generated. `graphify update .`:
  PASS, 1,294 nodes / 1,509 edges / 301 communities.

## 7. Unresolved limitations and open blockers

1. **The federal IWO bytes were not re-corroborated.** The endpoint returned HTTP 202 with an empty
   transport response. Preserve its separate guard and prior pinned evidence; do not infer drift.
2. **`--fetch` cannot corroborate what the catalog pins.** It issues HEAD only, so it can confirm a
   URL resolves but cannot detect a same-URL content replacement — precisely the drift that matters
   for a pinned SHA-256. Byte-level corroboration remains manual. A `--verify-bytes` mode was
   considered and deliberately not built in this lane.
3. **`--fetch` overwrites `ILLINOIS_FORMS_FRESHNESS.md` wholesale**, including its hand-written "how
   to verify" and "hard rules" sections. Pre-existing; flagged, not changed.
4. **The federal IWO address discrepancy** between the 2026-09-14 packet and the branch's evidence of
   record (§2) has not been reconciled on a single date.
5. **`app/legal-info/document-guide` is a live page making the exact claims this review is
   correcting — NOT FIXED, needs a ruling.** *(Status as of §9.4: the route is now redirected, so
   the claims are no longer reachable. The page's copy is unchanged and the ruling this item asks
   for is still open — it gates any lifting of that redirect.)*
   `/legal-info/court-forms` is 308-redirected to `/legal`,
   but `/legal-info/document-guide` is **not** in `LEGAL_INFO_REDIRECTS` and is reachable. It carries
   its own hardcoded form list, independent of the catalog, which:
   - labels statewide forms with **Cook County CCP numbers presented as `officialId`** — "CCP 0910.01",
     "CCP 0912.03", "CCP 0913.01" — where the printed statewide codes are ATJ 103.4, ATJ 251.5,
     ATJ 108.4. This is the statewide/county conflation §6.1 exists to prevent, on a customer-facing
     page;
   - names artifacts the 2026-09-14 packet could not corroborate as statewide forms —
     "Allocation Judgment (CCP 0913.02)", "Schedule A - Real Estate (CCP 0912.04)",
     "Schedule B - Personal Property (CCP 0912.05)", "Certificate of Service (CCP 0101.00)";
   - states "Our system fills out official Illinois court forms using your answers", a generation
     claim, and "E-file or print and file your documents with the circuit court", a filing-readiness
     claim.

   It was left unchanged on purpose. It is questionnaire→form mapping copy, which this lane is
   directed not to touch; its `schedule-a` / `schedule-b` ids are pinned by an existing test
   (`__tests__/app/public-claims-boundaries.test.ts`); and the replacement copy is owner/legal-gated.
   **This is the most serious open item in the review and needs an owner decision** — redirect the
   route, or remediate the page in its own lane.
6. **Two stale catalog ids remain referenced.** `app/legal-info/court-forms/court-forms-client.tsx:50`
   and `app/legal-info/document-guide/page.tsx:120` both still reference `allocation-judgment`, which
   no longer exists in the catalog. In the client it is a dead lookup key on a redirected page
   (harmless); in the document guide it is item 6 above. *(Status as of §9.4: the client-side
   reference is removed along with the whole questionnaire map; the document-guide reference stands
   behind the new redirect.)*
7. **Field mapping and generated-output diffing against the exact current PDFs have not been done**
   for any entry. That work is out of this lane and remains a precondition for any unpause.

## 8. Verdict

**NO UNPAUSE.** Catalog presence, a resolving URL, a printed code, and a pinned hash do not, together
or separately, constitute generation, download, packet, filing, or release authority.

- All 21 entries remain non-automation-eligible; `getFormPath` throws for every one.
- The federal IWO remains separately guarded behind its existing artifact, policy, county, and
  per-case gates. The HTTP 202 seen on 2026-09-21 is a transport observation and is **not** treated as
  form drift, nor as authority to release it.
- Unverified identities carry no official URL, no provenance, and no automation authority, and no
  longer enter automatic packets.
- `/legal-info/court-forms` stays behind its 308 redirect. `/legal-info/document-guide` is untouched
  and live, and is the open blocker of §7.6.

## 9. Addendum — independent review of this record, and its remediation (2026-09-21)

An independent read-only review of the state described above found seven further defects. All
seven are now closed **in the working tree, uncommitted**. Disposition is unchanged: **NO UNPAUSE.**
Nothing below lifts a hold, and none of it is generation, download, packet, filing, or release
authority.

**9.1 Two continuations were scoped to every case.** ATJ 253.1 (Additional My Child Support) and
ATJ 254.3 (Additional Health Insurance) carried `requiredFor: ["both"]`, placing both in every
no-children opening packet. Both are now `["with_children"]`. The other five
`financial-additional-*` continuations are genuinely case-type neutral and are unchanged.

**9.2 The FreshStart template was being reported as an unverified identity.** §6.3's
`withheldUnverified` list held all four withheld rows, including `marital-settlement-agreement` —
a document FreshStart wrote. That states an absence of corroboration about something whose
authorship is known, and it re-merges the exact distinction §6.1 exists to hold open. `CountyPacket`
now reports three separate buckets — `withheldUnverified`, `withheldFreshStartTemplates`,
`withheldCountyMismatch` — mapped from source class by a `Record<FormAuthority, …>` so a new class
cannot fall out of every bucket unnoticed, and a composable class reaching the withheld side throws
rather than dropping the row.

**9.3 Composability was read off the artifact-naming flag.** `isAutoPacketComposable` returned
`FORM_AUTHORITY_CLASSES[authority].mayCarryOfficialArtifact` — a provenance claim used as a
distribution decision. That makes the county case unrepresentable: a county artifact names no
statewide URL, so the flag is false, yet the rule for it is not "never compose" but "compose only
into its own county's packet." Each class now declares its own `autoPacketComposability`, and
`isAutoPacketComposable(form, { countyId })` requires a county context that a
`county_or_non_statewide` row must match via a new `issuingCountyId`. A county row that names no
issuing county never composes. The class remains empty on the current evidence (§5), so this is
inert today and asserted against a constructed row in test.

**9.4 Stale claims on the two form surfaces.** The redirected `/legal-info/court-forms` client still
carried, in source, "Let Us Fill Out Your Forms", an "Auto-Fill" control, "we'll automatically fill
out this form for you", "Generate Form", and "Always download forms to your computer" — for a
catalog in which `getFormPath` throws for all 21 entries. The controls were unreachable only by
accident (they rendered solely for an entry with a server-issued `downloadHref`, and the only entry
that can have one, the federal IWO, was absent from the questionnaire map), so lifting the route's
redirect would have published all of it. The questionnaire→form map — which also held four ids the
reconciled catalog does not contain, including the `allocation-judgment` of §7.6 — and every control
it drove are removed. The page now states it is a reference index that does not prepare, complete, or
supply forms. The single server-decided `downloadHref` control is unchanged.

`/legal-info/document-guide` (§7.5, the review's most serious open item) is now in
`LEGAL_INFO_REDIRECTS` and 308s to `/legal`. Its copy is deliberately **not** rewritten: it is
questionnaire→form mapping, the replacement text is owner/legal-gated, and
`__tests__/app/public-claims-boundaries.test.ts` pins its `schedule-a`/`schedule-b` block. The route
is closed instead. `__tests__/app/court-forms-claims-boundaries.test.ts` asserts both redirects, the
absence of each auto-fill/download claim and each stale id in the client, and — so the guard cannot
become a vacuous pass — that the document guide's CCP and generation strings still exist and are
still behind the redirect. **§7.5 is contained, not remediated. The page's copy still needs the
owner ruling it asked for, before any lifting of that redirect.**

**9.5 `--fetch` laundered drift.** It ran unconditionally, then rebuilt every manifest entry with
`catalogVersion: c.version`, `catalogLastUpdated: c.lastUpdated` and the catalog's `officialUrl`.
Any unreviewed catalog edit was therefore adopted into the committed manifest by the act of checking
freshness, and the post-write diff — taken against the manifest just overwritten from the catalog —
returned clean and exited 0. Drift now fails in every mode, and in `--fetch` it fails at
`fetchPreflight` **before any network call or write**. The write path (`manifestWithVerifications`)
touches `verification` and the run stamp only, and the HEAD is issued against the manifest's own
pinned URL, never the catalog's. §7.2 and §7.3 are unchanged and still open: HEAD still cannot
corroborate a pinned SHA-256, and `--fetch` still overwrites this report wholesale.

**9.6 Invented and borrowed dates.** `il()` expanded a month-only printed revision into a day —
`03/25` became `2025-03-01` — and that invented day travelled into the manifest and the UI as though
observed. `unsupported()` stamped the 2026-09-14 reconciliation date on rows for which **no artifact
was found**, presenting a verification that did not happen. Official rows now carry month precision
(`2025-03`); uncorroborated rows carry the single `UNVERIFIED_CATALOG_VALUE` sentinel for both
version and date; the manifest matches entry for entry; and the UI renders the sentinel through
`formatCatalogLastUpdated` as "not verified" rather than as a date. The federal IWO's `2026-07-21` is
an actual retrieval date at day precision and is unchanged.

**9.7 A weak negative assertion.** `expect(ids).not.toEqual(expect.arrayContaining([...6 ids]))`
passes as soon as any ONE member is absent — five of the six invented schedule ids could have
returned with the test still green. Replaced with a per-id `not.toContain` loop, as was the combined
withheld-id check.

### 9.8 Verification of this addendum

Recorded separately in the handoff for the exact working-tree state. No commit, push, PR, or deploy
was made and no external state was mutated. This addendum is an evidence record, not an approval.

## 10. Actions not performed

No deployment, push, commit, or pull request. No external contact. Rex performed read-only official
source retrieval and local verification only. No production, customer, payment, database, or provider
state was mutated. No form was generated, substituted, or filed. No legal advice is given or implied.
