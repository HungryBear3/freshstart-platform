import type { ReactNode } from "react"
import { requireCurrentAdminPage } from "@/lib/auth/require-current-admin-page"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireCurrentAdminPage()
  return children
}
