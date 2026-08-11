import { resolve } from "node:path"
import { config } from "dotenv"
import type { Prisma } from "@prisma/client"
import type { QuestionnaireStructure } from "@/types/questionnaire"
import {
  applyGroundsRemediationUpdate,
  parseGroundsRemediationArgs,
} from "@/lib/questionnaires/grounds-remediation-command"
import { normalizeIllinoisPetitionGrounds } from "@/lib/questionnaires/illinois-divorce-grounds"

config({ path: resolve(process.cwd(), ".env.local"), quiet: true })
config({ quiet: true })

function getGroundsOptions(structure: QuestionnaireStructure) {
  return structure.sections
    .find(section => section.id === "grounds")
    ?.questions.find(question => question.id === "grounds-type")?.options
}

function getGroundsQuestionIds(structure: QuestionnaireStructure) {
  return structure.sections
    .find(section => section.id === "grounds")
    ?.questions.map(question => question.id)
}

async function main() {
  const args = parseGroundsRemediationArgs(process.argv.slice(2))
  const { prisma } = await import("@/lib/db")

  try {
    const questionnaire = await prisma.questionnaire.findUnique({
      where: { id: args.expectedId },
      select: { id: true, type: true, isActive: true, structure: true, updatedAt: true },
    })

    if (!questionnaire) throw new Error(`questionnaire was not found: ${args.expectedId}`)
    if (questionnaire.type !== "petition") throw new Error("questionnaire is not a petition")
    if (!questionnaire.isActive) throw new Error("petition questionnaire is not active")

    const before = questionnaire.structure as unknown as QuestionnaireStructure
    const after = normalizeIllinoisPetitionGrounds(before)
    const changed = JSON.stringify(before) !== JSON.stringify(after)

    console.log(
      JSON.stringify(
        {
          mode: args.apply ? "apply" : "dry-run",
          questionnaireId: questionnaire.id,
          changed,
          beforeOptions: getGroundsOptions(before),
          afterOptions: getGroundsOptions(after),
          beforeQuestionIds: getGroundsQuestionIds(before),
          afterQuestionIds: getGroundsQuestionIds(after),
        },
        null,
        2
      )
    )

    if (!args.apply || !changed) return

    await applyGroundsRemediationUpdate(
      input =>
        prisma.questionnaire.updateMany({
          where: input.where,
          data: { structure: input.data.structure },
        }),
      {
        expectedId: questionnaire.id,
        updatedAt: questionnaire.updatedAt,
        structure: after as unknown as Prisma.InputJsonValue,
      }
    )

    console.log(JSON.stringify({ applied: true, questionnaireId: questionnaire.id }))
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(error => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
