/**
 * Court Forms Library — SERVER component.
 *
 * Availability is decided here, on the server, by the guarded read model. The
 * client component receives only what it is allowed to render, so a gated
 * artifact has no download control and no static path to leak.
 *
 * No county context is available on this public reference page, so the county
 * id is deliberately absent and every county-conditional artifact fails closed.
 */
import { getCourtFormsReadModel } from "@/lib/forms/court-forms-read-model"

import CourtFormsLibraryPage from "./court-forms-client"

// The gate depends on on-disk artifact state and the current date, so this must
// not be statically prerendered and frozen at build time.
export const dynamic = "force-dynamic"

export default function CourtFormsLibraryRoute() {
  const { forms, gatedNotices } = getCourtFormsReadModel()

  return <CourtFormsLibraryPage forms={forms} gatedNotices={gatedNotices} />
}
