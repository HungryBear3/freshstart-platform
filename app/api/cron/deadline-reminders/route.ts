/**
 * Cron endpoint for sending divorce case deadline reminders.
 * Run daily via Vercel Cron or external scheduler: GET /api/cron/deadline-reminders
 */
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sendDeadlineReminderEmail } from "@/lib/email"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const expectedKey = process.env.CRON_SECRET
  if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  sevenDaysFromNow.setHours(23, 59, 59, 999)

  // Find incomplete deadlines due in next 7 days that haven't had a reminder sent
  const fourteenDaysFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
  fourteenDaysFromNow.setHours(23, 59, 59, 999)

  const deadlines = await prisma.deadline.findMany({
    where: {
      completed: false,
      reminderSent: false,
      dueDate: { gte: now, lte: fourteenDaysFromNow },
    },
    include: {
      caseInfo: {
        include: {
          user: {
            select: {
              email: true,
              name: true,
              notificationPreferences: {
                select: { deadlineReminders: true, reminderDaysBefore: true },
              },
            },
          },
        },
      },
    },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"
  const dashboardLink = `${appUrl}/dashboard/case`
  let sent = 0

  for (const deadline of deadlines) {
    const user = deadline.caseInfo?.user
    if (!user?.email) continue

    // Respect notification preferences (default: send if no prefs set)
    const prefs = deadline.caseInfo?.user?.notificationPreferences
    if (prefs && !prefs.deadlineReminders) continue

    const diff = new Date(deadline.dueDate).getTime() - now.getTime()
    const daysRemaining = Math.ceil(diff / (24 * 60 * 60 * 1000))

    const maxDays = prefs?.reminderDaysBefore ?? 7
    const reminderDays = [1, 3, 7, 14].filter((d) => d <= maxDays)
    if (!reminderDays.includes(daysRemaining)) continue

    const result = await sendDeadlineReminderEmail({
      to: user.email,
      userName: user.name,
      deadlineTitle: deadline.title,
      dueDate: new Date(deadline.dueDate),
      daysRemaining,
      dashboardLink,
    })

    if (result.success) {
      await prisma.deadline.update({
        where: { id: deadline.id },
        data: { reminderSent: true },
      })
      sent++
    }
  }

  return NextResponse.json({ success: true, emailsSent: sent })
}
