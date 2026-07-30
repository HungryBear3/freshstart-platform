import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth/session"

export async function requireCurrentAdminPage() {
  const sessionUser = await getCurrentUser()
  if (!sessionUser?.id) redirect("/auth/signin")

  const currentUser = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, email: true, role: true },
  })
  if (currentUser?.role !== "admin") redirect("/dashboard")

  return currentUser
}
