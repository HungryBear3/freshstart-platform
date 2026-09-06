/**
 * @jest-environment node
 *
 * Pure funnel state machine. Every guarantee the privacy brief asks for that
 * can be decided without a browser lives here: exactly-once per real state
 * transition, no emission on hydration or on cached-state replay, and bounded
 * enum/number payloads only.
 */
import {
  FUNNEL_QUESTIONNAIRE_TYPES,
  IntakeFunnelTracker,
  toFunnelQuestionnaireType,
} from "@/lib/analytics/intake-funnel"

describe("toFunnelQuestionnaireType", () => {
  it("passes through every seeded questionnaire type", () => {
    expect(FUNNEL_QUESTIONNAIRE_TYPES).toEqual([
      "petition",
      "financial_affidavit",
      "parenting_plan",
      "marital_settlement",
    ])
    for (const type of FUNNEL_QUESTIONNAIRE_TYPES) {
      expect(toFunnelQuestionnaireType(type)).toBe(type)
    }
  })

  it("collapses anything unrecognized to the bounded 'other' bucket", () => {
    for (const raw of [
      null,
      undefined,
      "",
      "PETITION",
      "petition ",
      "jane.doe@example.com",
      "cs_test_a1b2c3",
      "/questionnaires/petition?responseId=abc",
      "a".repeat(500),
    ]) {
      expect(toFunnelQuestionnaireType(raw)).toBe("other")
    }
  })
})

describe("IntakeFunnelTracker", () => {
  it("emits nothing before the intake has finished loading", () => {
    const tracker = new IntakeFunnelTracker("petition")

    expect(tracker.recordUserInput()).toBeNull()
    expect(tracker.recordSectionCleared({ sectionIndex: 0, totalSections: 4 })).toBeNull()
    expect(tracker.recordConfirmedCompletion()).toBeNull()
  })

  it("emits exactly one start on the first real input of a fresh intake", () => {
    const tracker = new IntakeFunnelTracker("petition")
    tracker.markLoaded({ hasPersistedProgress: false })

    expect(tracker.recordUserInput()).toEqual({
      name: "questionnaire_start",
      questionnaireType: "petition",
    })
    expect(tracker.recordUserInput()).toBeNull()
    expect(tracker.recordUserInput()).toBeNull()
  })

  it("never emits a start when a saved draft is resumed", () => {
    const tracker = new IntakeFunnelTracker("parenting_plan")
    tracker.markLoaded({ hasPersistedProgress: true, resumedSectionIndex: 0 })

    expect(tracker.recordUserInput()).toBeNull()
  })

  it("ignores repeat load notifications so a re-render cannot reopen a guard", () => {
    const tracker = new IntakeFunnelTracker("petition")
    tracker.markLoaded({ hasPersistedProgress: false })
    expect(tracker.recordUserInput()).not.toBeNull()

    tracker.markLoaded({ hasPersistedProgress: false })
    expect(tracker.recordUserInput()).toBeNull()
  })

  it("emits one section_complete per section, in either navigation direction", () => {
    const tracker = new IntakeFunnelTracker("financial_affidavit")
    tracker.markLoaded({ hasPersistedProgress: false })

    expect(tracker.recordSectionCleared({ sectionIndex: 0, totalSections: 4 })).toEqual({
      name: "questionnaire_section_complete",
      questionnaireType: "financial_affidavit",
      sectionIndex: 0,
      totalSections: 4,
    })
    expect(tracker.recordSectionCleared({ sectionIndex: 1, totalSections: 4 })).toEqual({
      name: "questionnaire_section_complete",
      questionnaireType: "financial_affidavit",
      sectionIndex: 1,
      totalSections: 4,
    })
    // Walking back over already-counted ground is not new progress.
    expect(tracker.recordSectionCleared({ sectionIndex: 0, totalSections: 4 })).toBeNull()
    expect(tracker.recordSectionCleared({ sectionIndex: 1, totalSections: 4 })).toBeNull()
  })

  it("treats sections already finished in a resumed draft as cached state", () => {
    const tracker = new IntakeFunnelTracker("petition")
    tracker.markLoaded({ hasPersistedProgress: true, resumedSectionIndex: 2 })

    expect(tracker.recordSectionCleared({ sectionIndex: 0, totalSections: 5 })).toBeNull()
    expect(tracker.recordSectionCleared({ sectionIndex: 1, totalSections: 5 })).toBeNull()
    expect(tracker.recordSectionCleared({ sectionIndex: 2, totalSections: 5 })).toEqual({
      name: "questionnaire_section_complete",
      questionnaireType: "petition",
      sectionIndex: 2,
      totalSections: 5,
    })
  })

  it("refuses section payloads that are not bounded counts", () => {
    const tracker = new IntakeFunnelTracker("petition")
    tracker.markLoaded({ hasPersistedProgress: false })

    for (const input of [
      { sectionIndex: -1, totalSections: 4 },
      { sectionIndex: 4, totalSections: 4 },
      { sectionIndex: 0, totalSections: 0 },
      { sectionIndex: 1.5, totalSections: 4 },
      { sectionIndex: 0, totalSections: 4.5 },
      { sectionIndex: Number.NaN, totalSections: 4 },
      { sectionIndex: 0, totalSections: 1001 },
    ]) {
      expect(tracker.recordSectionCleared(input)).toBeNull()
    }
  })

  it("emits exactly one completion", () => {
    const tracker = new IntakeFunnelTracker("marital_settlement")
    tracker.markLoaded({ hasPersistedProgress: true, resumedSectionIndex: 3 })

    expect(tracker.recordConfirmedCompletion()).toEqual({
      name: "questionnaire_complete",
      questionnaireType: "marital_settlement",
    })
    expect(tracker.recordConfirmedCompletion()).toBeNull()
  })

  it("reports an unrecognized route type as the bounded 'other' bucket", () => {
    const tracker = new IntakeFunnelTracker("something-operators-never-seeded")
    tracker.markLoaded({ hasPersistedProgress: false })

    expect(tracker.recordUserInput()).toEqual({
      name: "questionnaire_start",
      questionnaireType: "other",
    })
  })
})
