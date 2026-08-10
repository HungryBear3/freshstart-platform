/**
 * Document Package API
 *
 * Creates a ZIP file containing the user's documents for download, with a
 * cover sheet, filing instructions, and a checklist.
 *
 * The handler itself lives in `lib/documents/package-handler.ts` as a
 * dependency-injected factory so its real behavior — including the exact bytes
 * written into the archive — is testable without a shared database or real
 * credentials. This route owns the production dependencies: authentication,
 * row selection, authoritative stored-county lookup, the current clock, and
 * the pinned renewal evidence (supplied by omission, i.e. the pinned default).
 */
import { auth } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/db"
import { createDocumentPackageHandler } from "@/lib/documents/package-handler"

export const dynamic = "force-dynamic"

export const GET = createDocumentPackageHandler({
  getUserId: async () => {
    const session = await auth()
    return session?.user?.id ?? null
  },
  loadReadyDocuments: (userId) =>
    prisma.document.findMany({
      where: { userId, status: 'ready' },
      orderBy: { generatedAt: 'desc' },
    }),
  loadStoredCounty: async (userId) => {
    const caseInfo = await prisma.caseInfo.findUnique({
      where: { userId },
      select: { county: true },
    })
    return caseInfo?.county
  },
  loadUser: (userId) =>
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    }),
})
