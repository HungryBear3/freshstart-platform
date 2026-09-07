/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://www.freshstart-il.com/questionnaires/petition"}
 *
 * Meta Pixel sensitivity boundary.
 *
 * Intake milestones are legal-service signals: knowing that a given browser
 * started or finished a divorce petition, generated a court document, or
 * uploaded a prenuptial agreement is the sensitive fact, regardless of how
 * coarse the payload is. The published privacy wording scopes the pixel to
 * "pages visited, clicks" and promises case data is not shared with marketing
 * partners, so no intake milestone may reach `fbq` at all.
 *
 * These tests are the boundary, not a payload-shape check: the assertion is
 * that `fbq` is never invoked for an intake milestone, while first-party/GA4
 * dispatch and the permitted commerce/account Meta events stay byte-identical.
 *
 * The last describe block pins the permitted Meta surface exhaustively — in
 * source and at runtime — so no future claim about which events Meta receives
 * can drift away from what the module actually dispatches.
 *
 * The gate is opened here (production host + opt-in env) precisely so a
 * regression cannot hide behind a closed gate.
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { analytics } from "@/lib/analytics/events"

const EVENTS_MODULE_PATH = "lib/analytics/events.ts"

/** Text of the dispatch module, for the source locks below. */
function eventsSource(): string {
  return readFileSync(join(process.cwd(), EVENTS_MODULE_PATH), "utf8")
}

function fbqCalls(): unknown[][] {
  return (window.fbq as unknown as jest.Mock).mock.calls
}

function gtagCalls(): unknown[][] {
  return (window.gtag as jest.Mock).mock.calls
}

describe("Meta Pixel receives no questionnaire milestones", () => {
  const originalEnabled = process.env.NEXT_PUBLIC_ENABLE_TRACKING

  beforeEach(() => {
    process.env.NEXT_PUBLIC_ENABLE_TRACKING = "true"
    window.gtag = jest.fn()
    ;(window as unknown as { fbq: unknown }).fbq = jest.fn()
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_ENABLE_TRACKING = originalEnabled
    jest.restoreAllMocks()
  })

  it("questionnaireStart sends nothing to Meta and leaves GA4 unchanged", () => {
    analytics.questionnaireStart("petition")

    expect(fbqCalls()).toEqual([])
    expect(gtagCalls()).toEqual([
      ["event", "questionnaire_start", { questionnaire_type: "petition" }],
    ])
  })

  it("questionnaireComplete sends nothing to Meta and leaves GA4 unchanged", () => {
    analytics.questionnaireComplete("marital_settlement")

    expect(fbqCalls()).toEqual([])
    expect(gtagCalls()).toEqual([
      ["event", "questionnaire_complete", { questionnaire_type: "marital_settlement" }],
    ])
  })

  it("no intermediate questionnaire milestone reaches Meta either", () => {
    analytics.questionnaireSectionComplete("financial_affidavit", 1, 4)
    analytics.questionnaireAbandon("parenting_plan", 2, 5)

    expect(fbqCalls()).toEqual([])
    expect(gtagCalls()).toHaveLength(2)
  })

  it("a full intake journey leaks no questionnaire signal to Meta", () => {
    analytics.questionnaireStart("petition")
    analytics.questionnaireSectionComplete("petition", 0, 3)
    analytics.questionnaireSectionComplete("petition", 1, 3)
    analytics.questionnaireSectionComplete("petition", 2, 3)
    analytics.questionnaireComplete("petition")

    expect(fbqCalls()).toEqual([])
    // Every first-party milestone still lands.
    expect(gtagCalls()).toHaveLength(5)
    const serializedFbq = JSON.stringify(fbqCalls())
    for (const fragment of [
      "petition",
      "questionnaire",
      "QuestionnaireStart",
      "CompleteRegistration",
    ]) {
      expect(serializedFbq).not.toContain(fragment)
    }
  })

  it("keeps the questionnaire Meta event names out of the events module", () => {
    const source = eventsSource()
    expect(source).not.toContain("QuestionnaireStart")
    expect(source).not.toContain("CompleteRegistration")
  })
})

describe("Meta Pixel receives no document or prenup-upload milestones", () => {
  const originalEnabled = process.env.NEXT_PUBLIC_ENABLE_TRACKING

  beforeEach(() => {
    process.env.NEXT_PUBLIC_ENABLE_TRACKING = "true"
    window.gtag = jest.fn()
    ;(window as unknown as { fbq: unknown }).fbq = jest.fn()
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_ENABLE_TRACKING = originalEnabled
    jest.restoreAllMocks()
  })

  // Each case asserts the first-party payload *before* the Meta payload on
  // purpose. Against the pre-change module these tests fail only on the Meta
  // assertion, which is what makes "the GA4 payload is unchanged" an observed
  // result rather than a claim.

  it("documentGenerate keeps its exact GA4 payload and sends nothing to Meta", () => {
    analytics.documentGenerate("petition", true)

    expect(gtagCalls()).toEqual([
      ["event", "document_generate", { document_type: "petition", is_official_form: true }],
    ])
    // Byte-level, not just structural: a widened parameter is a literal diff.
    expect(JSON.stringify(gtagCalls())).toBe(
      '[["event","document_generate",{"document_type":"petition","is_official_form":true}]]',
    )
    expect(fbqCalls()).toEqual([])
  })

  it("documentGenerate for an unofficial form is equally invisible to Meta", () => {
    analytics.documentGenerate("parenting_plan", false)

    expect(JSON.stringify(gtagCalls())).toBe(
      '[["event","document_generate",{"document_type":"parenting_plan","is_official_form":false}]]',
    )
    expect(fbqCalls()).toEqual([])
  })

  it("prenupDocumentUpload keeps its exact GA4 payload and sends nothing to Meta", () => {
    analytics.prenupDocumentUpload("prenup", 482113)

    expect(gtagCalls()).toEqual([
      ["event", "prenup_document_upload", { document_type: "prenup", file_size: 482113 }],
    ])
    expect(JSON.stringify(gtagCalls())).toBe(
      '[["event","prenup_document_upload",{"document_type":"prenup","file_size":482113}]]',
    )
    expect(fbqCalls()).toEqual([])
  })

  it("prenupDocumentUpload with no file size reaches neither transport", () => {
    // Pre-existing behavior, asserted here so the removal cannot be credited
    // with changing it: an absent `file_size` is an unsafe param value, so the
    // client sanitizer drops the whole GA4 event. Before this change that left
    // Meta as the *only* recipient of the upload signal.
    analytics.prenupDocumentUpload("postnup")

    expect(gtagCalls()).toEqual([])
    expect(fbqCalls()).toEqual([])
  })

  it("a full document journey leaks no signal to Meta", () => {
    analytics.documentGenerateStart("petition", true)
    analytics.documentGenerate("petition", true)
    analytics.documentDownload("petition", "petition-2026.pdf")
    analytics.documentPackageDownload(3)
    analytics.prenupDocumentUpload("prenup", 482113)

    expect(fbqCalls()).toEqual([])
    // Four of the five land first-party; `documentDownload` carries a
    // free-form file name, which the client sanitizer rejects outright.
    expect(gtagCalls()).toHaveLength(4)
    const serializedFbq = JSON.stringify(fbqCalls())
    for (const fragment of [
      "petition",
      "prenup",
      "document",
      "DocumentGenerate",
      "PrenupDocumentUpload",
    ]) {
      expect(serializedFbq).not.toContain(fragment)
    }
  })
})

describe("permitted non-sensitive Meta events are untouched", () => {
  const originalEnabled = process.env.NEXT_PUBLIC_ENABLE_TRACKING

  beforeEach(() => {
    process.env.NEXT_PUBLIC_ENABLE_TRACKING = "true"
    window.gtag = jest.fn()
    ;(window as unknown as { fbq: unknown }).fbq = jest.fn()
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_ENABLE_TRACKING = originalEnabled
    jest.restoreAllMocks()
  })

  it("signUp still sends the account-level Lead event", () => {
    analytics.signUp("email")

    expect(fbqCalls()).toEqual([
      ["track", "Lead", { content_name: "signup", method: "email" }],
    ])
    expect(gtagCalls()).toEqual([["event", "sign_up", { method: "email" }]])
  })

  it("subscriptionStart still sends the commerce InitiateCheckout event", () => {
    analytics.subscriptionStart("one_time", 149)

    expect(fbqCalls()).toEqual([
      ["track", "InitiateCheckout", { content_name: "one_time", currency: "USD", value: 149 }],
    ])
    expect(gtagCalls()).toHaveLength(1)
  })

  it("trialStart still sends the commerce StartTrial event", () => {
    analytics.trialStart("one_time", 7)

    expect(fbqCalls()).toEqual([
      ["track", "StartTrial", { content_name: "one_time", predicted_ltv: 299 }],
    ])
    expect(gtagCalls()).toEqual([
      ["event", "trial_start", { plan_name: "one_time", trial_days: 7 }],
    ])
  })
})

describe("the permitted Meta surface is exactly the account/commerce events", () => {
  /**
   * The complete set of Meta events this product is allowed to emit. Anything
   * else dispatched from `lib/analytics/events.ts` is, by construction, an
   * intake signal — that is why the enumeration lives in a test rather than
   * only in a commit message or a comment.
   */
  const PERMITTED_META_EVENTS = ["InitiateCheckout", "Lead", "StartTrial"]

  const originalEnabled = process.env.NEXT_PUBLIC_ENABLE_TRACKING

  beforeEach(() => {
    process.env.NEXT_PUBLIC_ENABLE_TRACKING = "true"
    window.gtag = jest.fn()
    ;(window as unknown as { fbq: unknown }).fbq = jest.fn()
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_ENABLE_TRACKING = originalEnabled
    jest.restoreAllMocks()
  })

  /**
   * One invocation per exported helper, with arguments that satisfy its
   * signature. Typing this as a total `Record` over `keyof typeof analytics`
   * makes `tsc` fail when a helper is added without a decision about its Meta
   * exposure, so the runtime surface check below can never go stale silently.
   */
  const DRIVE_EVERY_HELPER: Record<keyof typeof analytics, () => void> = {
    signUp: () => analytics.signUp("email"),
    login: () => analytics.login("email"),
    pageView: () => analytics.pageView("/pricing", "Pricing"),
    questionnaireStart: () => analytics.questionnaireStart("petition"),
    questionnaireSectionComplete: () =>
      analytics.questionnaireSectionComplete("petition", 0, 3),
    questionnaireComplete: () => analytics.questionnaireComplete("petition"),
    questionnaireAbandon: () => analytics.questionnaireAbandon("petition", 1, 3),
    documentGenerateStart: () => analytics.documentGenerateStart("petition", true),
    documentGenerate: () => analytics.documentGenerate("petition", true),
    documentDownload: () => analytics.documentDownload("petition", "petition-2026.pdf"),
    documentPackageDownload: () => analytics.documentPackageDownload(3),
    subscriptionStart: () => analytics.subscriptionStart("one_time", 149),
    trialStart: () => analytics.trialStart("one_time", 7),
    subscriptionCancel: () => analytics.subscriptionCancel("one_time", "too_expensive"),
    courtFormView: () => analytics.courtFormView("il_2_1", "petition"),
    courtFormDownload: () => analytics.courtFormDownload("il_2_1", "petition"),
    efilingGuideView: () => analytics.efilingGuideView("filing"),
    legalInfoView: () => analytics.legalInfoView("grounds"),
    calculatorUse: () => analytics.calculatorUse("child_support"),
    search: () => analytics.search("custody"),
    prenupSectionStart: () => analytics.prenupSectionStart("petition"),
    prenupSectionComplete: () => analytics.prenupSectionComplete("petition", true),
    prenupDocumentUpload: () => analytics.prenupDocumentUpload("prenup", 482113),
    prenupStatusClassified: () => analytics.prenupStatusClassified("disputed"),
    prenupSafetyConcernsDetected: () =>
      analytics.prenupSafetyConcernsDetected(["coercion"]),
    prenupSafetyResourcesView: () => analytics.prenupSafetyResourcesView(),
    prenupGuidanceBannerView: () => analytics.prenupGuidanceBannerView("unclear"),
    error: () => analytics.error("upload_failed", "boom", "prenup_upload"),
  }

  it("drives every exported analytics helper", () => {
    expect(Object.keys(DRIVE_EVERY_HELPER).sort()).toEqual(Object.keys(analytics).sort())
  })

  it("emits only the permitted Meta events when every helper is driven", () => {
    for (const drive of Object.values(DRIVE_EVERY_HELPER)) drive()

    const metaEventNames = fbqCalls().map((call) => call[1] as string)
    expect(metaEventNames.slice().sort()).toEqual(PERMITTED_META_EVENTS)
  })

  it("keeps the removed document and upload Meta event names out of the events module", () => {
    const source = eventsSource()
    expect(source).not.toContain("DocumentGenerate")
    expect(source).not.toContain("PrenupDocumentUpload")
  })

  it("dispatches no Meta custom event at all from the events module", () => {
    // Every Meta custom event this module has ever carried was an intake
    // signal. Locking the helper out of the module entirely means adding one
    // back is a deliberate, reviewable act rather than an incremental line.
    expect(eventsSource()).not.toContain("trackMetaCustomEvent")
  })

  it("enumerates exactly the permitted Meta event names in source", () => {
    const dispatched = Array.from(
      eventsSource().matchAll(/trackMeta(?:Custom)?Event\(\s*['"]([^'"]+)['"]/g),
    ).map((match) => match[1])

    expect(dispatched.slice().sort()).toEqual(PERMITTED_META_EVENTS)
  })
})
