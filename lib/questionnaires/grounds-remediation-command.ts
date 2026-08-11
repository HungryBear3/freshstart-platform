export interface GroundsRemediationArgs {
  apply: boolean
  expectedId: string
}

interface GroundsRemediationUpdateInput<T> {
  where: {
    id: string
    type: "petition"
    isActive: true
    updatedAt: Date
  }
  data: { structure: T }
}

interface GroundsRemediationUpdateParameters<T> {
  expectedId: string
  updatedAt: Date
  structure: T
}

export async function applyGroundsRemediationUpdate<T>(
  updateMany: (input: GroundsRemediationUpdateInput<T>) => Promise<{ count: number }>,
  parameters: GroundsRemediationUpdateParameters<T>
): Promise<void> {
  const result = await updateMany({
    where: {
      id: parameters.expectedId,
      type: "petition",
      isActive: true,
      updatedAt: parameters.updatedAt,
    },
    data: { structure: parameters.structure },
  })

  if (result.count !== 1) {
    throw new Error("questionnaire changed after inspection; no update applied")
  }
}

export function parseGroundsRemediationArgs(argv: string[]): GroundsRemediationArgs {
  let apply = false
  let expectedId = ""
  let sawExpectedId = false

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]

    if (argument === "--apply") {
      apply = true
      continue
    }

    if (argument === "--expected-id") {
      if (sawExpectedId) {
        throw new Error("--expected-id may be provided only once")
      }

      const value = argv[index + 1] ?? ""
      if (!value || value.startsWith("--")) {
        throw new Error("--expected-id requires a value")
      }

      expectedId = value
      sawExpectedId = true
      index += 1
      continue
    }

    throw new Error(`unknown argument: ${argument}`)
  }

  if (!expectedId) {
    throw new Error("--expected-id is required")
  }

  return { apply, expectedId }
}
