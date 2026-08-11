import { samplePetitionQuestionnaire } from "@/lib/questionnaires/sample-petition"
import type { QuestionnaireStructure } from "@/types/questionnaire"
import {
  CURRENT_ILLINOIS_PETITION_GROUNDS_LINES,
  ILLINOIS_DIVORCE_GROUNDS_OPTIONS,
  normalizeIllinoisPetitionGrounds,
  normalizeIllinoisPetitionResponseData,
  normalizeIllinoisPetitionResponses,
} from "@/lib/questionnaires/illinois-divorce-grounds"
import {
  applyGroundsRemediationUpdate,
  parseGroundsRemediationArgs,
} from "@/lib/questionnaires/grounds-remediation-command"

function groundsOptions(structure: typeof samplePetitionQuestionnaire) {
  const groundsSection = structure.sections.find(section => section.id === "grounds")
  const groundsQuestion = groundsSection?.questions.find(question => question.id === "grounds-type")
  return groundsQuestion?.options
}

describe("current Illinois divorce grounds", () => {
  it("allows only irreconcilable differences", () => {
    expect(ILLINOIS_DIVORCE_GROUNDS_OPTIONS).toEqual([
      {
        label: "Irreconcilable Differences (No-Fault)",
        value: "irreconcilable",
      },
    ])
  })

  it("keeps the reusable petition questionnaire on the canonical option set", () => {
    expect(groundsOptions(samplePetitionQuestionnaire)).toEqual(ILLINOIS_DIVORCE_GROUNDS_OPTIONS)
    const groundsSection = samplePetitionQuestionnaire.sections.find(
      section => section.id === "grounds"
    )
    expect(groundsSection?.questions.map(question => question.id)).not.toContain(
      "irreconcilable-duration"
    )
  })

  it("removes abolished options and the unsupported duration question without changing unrelated content", () => {
    const stored: QuestionnaireStructure = {
      id: "petition",
      name: "Petition",
      type: "petition",
      metadata: { estimatedTime: 15 },
      sections: [
        {
          id: "personal-info",
          title: "Personal Information",
          questions: [{ id: "name", type: "text", label: "Name", fieldName: "name" }],
        },
        {
          id: "grounds",
          title: "Grounds",
          questions: [
            {
              id: "grounds-type",
              type: "select",
              label: "Grounds for Divorce",
              fieldName: "groundsType",
              options: [
                { label: "Irreconcilable Differences (No-Fault)", value: "irreconcilable" },
                { label: "Adultery", value: "adultery" },
              ],
            },
            {
              id: "irreconcilable-duration",
              type: "number",
              label: "Duration",
              fieldName: "irreconcilableDuration",
            },
            {
              id: "case-reference",
              type: "text",
              label: "Case reference",
              fieldName: "caseReference",
            },
          ],
        },
      ],
    }

    const normalized = normalizeIllinoisPetitionGrounds(stored)

    expect(groundsOptions(normalized)).toEqual(ILLINOIS_DIVORCE_GROUNDS_OPTIONS)
    expect(normalized.sections[0]).toEqual(stored.sections[0])
    expect(normalized.sections[1].questions.map(question => question.id)).toEqual([
      "grounds-type",
      "case-reference",
    ])
    expect(normalized.sections[1].questions[1]).toEqual(stored.sections[1].questions[2])
    expect(stored.sections[1].questions[0].options).toHaveLength(2)
    expect(stored.sections[1].questions).toHaveLength(3)
  })

  it("refuses to normalize a structure missing the grounds question", () => {
    const malformed: QuestionnaireStructure = {
      id: "petition",
      name: "Petition",
      type: "petition",
      sections: [],
    }

    expect(() => normalizeIllinoisPetitionGrounds(malformed)).toThrow(
      "petition questionnaire is missing grounds-type"
    )
  })

  it("does not alter same-named questions outside the grounds section", () => {
    const unrelatedQuestions = [
      {
        id: "grounds-type",
        type: "text" as const,
        label: "Internal reference",
        fieldName: "internalGroundsType",
      },
      {
        id: "irreconcilable-duration",
        type: "number" as const,
        label: "Historical metric",
        fieldName: "historicalDuration",
      },
    ]
    const stored: QuestionnaireStructure = {
      id: "petition",
      name: "Petition",
      type: "petition",
      sections: [
        {
          id: "internal",
          title: "Internal",
          questions: unrelatedQuestions,
        },
        {
          id: "grounds",
          title: "Grounds",
          questions: [
            {
              id: "grounds-type",
              type: "select",
              label: "Grounds",
              fieldName: "groundsType",
              options: [{ label: "Adultery", value: "adultery" }],
            },
            {
              id: "irreconcilable-duration",
              type: "number",
              label: "Duration",
              fieldName: "irreconcilableDuration",
            },
          ],
        },
      ],
    }

    const normalized = normalizeIllinoisPetitionGrounds(stored)

    expect(normalized.sections[0].questions).toEqual(unrelatedQuestions)
    expect(normalized.sections[1].questions.map(question => question.id)).toEqual(["grounds-type"])
  })

  it("neutralizes abolished grounds in legacy saved responses without mutating the source", () => {
    const stored = {
      "grounds-type": "adultery",
      "irreconcilable-duration": 24,
      "petitioner-first-name": "Jane",
    }

    const normalized = normalizeIllinoisPetitionResponses(stored)

    expect(normalized).toEqual({
      "grounds-type": "irreconcilable",
      "petitioner-first-name": "Jane",
    })
    expect(stored).toEqual({
      "grounds-type": "adultery",
      "irreconcilable-duration": 24,
      "petitioner-first-name": "Jane",
    })
  })

  it("normalizes legacy petition responses at API boundaries but leaves other forms unchanged", () => {
    const legacyPetition = {
      "grounds-type": "adultery",
      "irreconcilable-duration": 24,
      name: "Jane",
    }
    const financialAffidavit = {
      "grounds-type": "internal-accounting-code",
      "irreconcilable-duration": 24,
    }

    expect(normalizeIllinoisPetitionResponseData("petition", legacyPetition)).toEqual({
      "grounds-type": "irreconcilable",
      name: "Jane",
    })
    expect(normalizeIllinoisPetitionResponseData("financial_affidavit", financialAffidavit)).toBe(
      financialAffidavit
    )
  })

  it("uses current statutory grounds text without a separation-duration assertion", () => {
    expect(CURRENT_ILLINOIS_PETITION_GROUNDS_LINES.join(" ")).toBe(
      "Irreconcilable differences have caused the irretrievable breakdown of the marriage. " +
        "Efforts at reconciliation have failed or future attempts at reconciliation would be " +
        "impracticable and not in the best interests of the family."
    )
    expect(CURRENT_ILLINOIS_PETITION_GROUNDS_LINES.join(" ")).not.toMatch(
      /separate|apart|month|duration/i
    )
  })
})

describe("grounds remediation command safety", () => {
  it("is dry-run by default and requires the exact questionnaire id", () => {
    expect(parseGroundsRemediationArgs(["--expected-id", "questionnaire-123"])).toEqual({
      apply: false,
      expectedId: "questionnaire-123",
    })
  })

  it("enables writes only when apply is explicit", () => {
    expect(parseGroundsRemediationArgs(["--expected-id", "questionnaire-123", "--apply"])).toEqual({
      apply: true,
      expectedId: "questionnaire-123",
    })
  })

  it("rejects missing ids and unknown arguments", () => {
    expect(() => parseGroundsRemediationArgs([])).toThrow("--expected-id is required")
    expect(() =>
      parseGroundsRemediationArgs(["--expected-id", "questionnaire-123", "--force"])
    ).toThrow("unknown argument: --force")
  })

  it("rejects duplicate ids and flag-shaped id values", () => {
    expect(() =>
      parseGroundsRemediationArgs([
        "--expected-id",
        "questionnaire-123",
        "--expected-id",
        "questionnaire-456",
      ])
    ).toThrow("--expected-id may be provided only once")
    expect(() => parseGroundsRemediationArgs(["--expected-id", "--apply"])).toThrow(
      "--expected-id requires a value"
    )
  })

  it("applies only through an optimistic exact-record predicate", async () => {
    const updatedAt = new Date("2026-08-11T17:00:00.000Z")
    const structure = { sections: [] }
    const updateMany = jest.fn().mockResolvedValue({ count: 1 })

    await applyGroundsRemediationUpdate(updateMany, {
      expectedId: "questionnaire-123",
      updatedAt,
      structure,
    })

    expect(updateMany).toHaveBeenCalledTimes(1)
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: "questionnaire-123",
        type: "petition",
        isActive: true,
        updatedAt,
      },
      data: { structure },
    })
  })

  it("fails closed when the questionnaire changed after inspection", async () => {
    const updateMany = jest.fn().mockResolvedValue({ count: 0 })

    await expect(
      applyGroundsRemediationUpdate(updateMany, {
        expectedId: "questionnaire-123",
        updatedAt: new Date("2026-08-11T17:00:00.000Z"),
        structure: { sections: [] },
      })
    ).rejects.toThrow("questionnaire changed after inspection; no update applied")
  })
})
