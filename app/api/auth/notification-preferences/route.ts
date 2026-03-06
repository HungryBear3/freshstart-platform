import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const prefs = await prisma.userNotificationPreferences.findUnique({
    where: { userId: user.id },
  })

  if (!prefs) {
    return NextResponse.json({
      deadlineReminders: true,
      marketingEmails: false,
      documentNotifications: true,
    })
  }

  return NextResponse.json({
    deadlineReminders: prefs.deadlineReminders,
    marketingEmails: prefs.marketingEmails,
    documentNotifications: prefs.documentNotifications,
  })
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const deadlineReminders = body.deadlineReminders
  const marketingEmails = body.marketingEmails
  const documentNotifications = body.documentNotifications

  const data: Record<string, boolean> = {}
  if (typeof deadlineReminders === "boolean") data.deadlineReminders = deadlineReminders
  if (typeof marketingEmails === "boolean") data.marketingEmails = marketingEmails
  if (typeof documentNotifications === "boolean") data.documentNotifications = documentNotifications

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
  }

  const prefs = await prisma.userNotificationPreferences.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      ...data,
    },
    update: data,
  })

  return NextResponse.json({
    deadlineReminders: prefs.deadlineReminders,
    marketingEmails: prefs.marketingEmails,
    documentNotifications: prefs.documentNotifications,
  })
}
