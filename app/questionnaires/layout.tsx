import type { Metadata } from "next"

/**
 * /questionnaires and /questionnaires/[type] are auth-gated working surfaces,
 * already excluded from app/sitemap.ts. Both were nevertheless serving 200 with
 * `index, follow` and the homepage canonical (Search Console, 2026-07-28).
 *
 * The directive lives on the segment layout so it also covers
 * /questionnaires/[type], which is a client component and therefore cannot
 * export `metadata` itself. Metadata cascades, so every route under this
 * segment — including query variants such as
 * /questionnaires/[type]?responseId=… — inherits `noindex, nofollow`.
 *
 * No canonical is declared here: a segment-level canonical would push
 * /questionnaires/[type] onto /questionnaires, repeating the wrong-canonical
 * defect one level down. /questionnaires declares its own canonical in
 * page.tsx; the noindexed dynamic children deliberately emit none.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function QuestionnairesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
