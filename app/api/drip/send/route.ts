import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sendEmail } from "@/lib/email"

type EmailContent = { subject: string; html: string; text: string }

function getEmailContent(step: number, email: string): EmailContent | null {
  const cta = `<p><a href="https://freshstart-il.com" style="color:#2563eb;">Visit FreshStart IL →</a></p>`

  switch (step) {
    case 1:
      return {
        subject: "Your Illinois Divorce Checklist",
        text: `You're subscribed! We'll send you helpful tips over the next few weeks. In the meantime, visit freshstart-il.com to get started.`,
        html: `<p>You're subscribed to our Illinois divorce guidance series.</p><p>Over the next few weeks, we'll share tips to help you navigate your divorce — without overpaying for a lawyer.</p>${cta}`,
      }
    case 2:
      return {
        subject: "The #1 mistake people make when filing for divorce in Illinois",
        text: `Missing the Financial Affidavit notarization is the most common reason Illinois divorces get delayed. Every divorce with disputed finances requires a notarized Financial Affidavit — and most people miss it. FreshStart IL walks you through every required form so nothing slips through. Visit freshstart-il.com`,
        html: `<p><strong>Missing the Financial Affidavit notarization.</strong></p><p>It's the most common reason Illinois divorces get delayed or rejected. Every divorce involving disputed finances requires a notarized Financial Affidavit — and most people don't know until they're already at the courthouse.</p><p>FreshStart IL walks you through every required form so nothing slips through the cracks.</p>${cta}`,
      }
    case 3:
      return {
        subject: "How much does divorce actually cost in Illinois?",
        text: `Filing fees in Illinois run $300–$400. That's the unavoidable part. Attorney fees? $250–$400/hour, often $5,000–$15,000+ total. FreshStart IL helps you handle the paperwork yourself for a fraction of that. Visit freshstart-il.com`,
        html: `<p><strong>Illinois divorce costs — the real breakdown:</strong></p><ul><li>Court filing fees: $300–$400 (unavoidable)</li><li>Attorney fees: $250–$400/hr, often $5,000–$15,000+ total</li><li>FreshStart IL: a fraction of that, done yourself</li></ul><p>If your divorce is uncontested, you likely don't need a lawyer for the paperwork.</p>${cta}`,
      }
    case 4:
      return {
        subject: "Is your spouse delaying your divorce? Here's what to do.",
        text: `In Illinois, if your spouse is unresponsive, you can request a default judgment after 30 days. Document everything. File on time. Don't let delays drag this out. FreshStart IL can help you stay on track. Visit freshstart-il.com`,
        html: `<p>If your spouse isn't responding, you're not stuck.</p><p>In Illinois, you can request a <strong>default judgment</strong> after 30 days of non-response. The key is filing correctly and on time.</p><p>Tips to keep things moving:<br>• Document every communication attempt<br>• File a Summons if they won't respond<br>• Don't miss your court dates</p><p>FreshStart IL helps you stay on track through every step.</p>${cta}`,
      }
    case 5:
      return {
        subject: "Still thinking about it? Here's a free trial.",
        text: `It's been a month since you downloaded our checklist. If you're ready to move forward, FreshStart IL is here. Start your Illinois divorce paperwork today — no attorney required. Visit freshstart-il.com`,
        html: `<p>It's been a month since you grabbed our checklist.</p><p>If you're still weighing your options — that's okay. Divorce is a big decision.</p><p>When you're ready, FreshStart IL makes the paperwork side simple. Start when it feels right.</p>${cta}`,
      }
    default:
      return null
  }
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization")
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const due = await prisma.dripEmail.findMany({
    where: {
      scheduledFor: { lte: now },
      sentAt: null,
    },
    take: 50,
    orderBy: { scheduledFor: "asc" },
  })

  let sent = 0
  let failed = 0

  for (const record of due) {
    const content = getEmailContent(record.step, record.email)
    if (!content) {
      await prisma.dripEmail.update({
        where: { id: record.id },
        data: { sentAt: now },
      })
      continue
    }

    try {
      const result = await sendEmail({
        to: record.email,
        subject: content.subject,
        html: content.html,
        text: content.text,
      })

      if (result.success) {
        await prisma.dripEmail.update({
          where: { id: record.id },
          data: { sentAt: now },
        })
        sent++
      } else {
        console.error(`[drip] Failed to send step ${record.step} to ${record.email}:`, result.error)
        failed++
      }
    } catch (err) {
      console.error(`[drip] Exception sending step ${record.step} to ${record.email}:`, err)
      failed++
    }
  }

  return NextResponse.json({ sent, failed, total: due.length })
}
