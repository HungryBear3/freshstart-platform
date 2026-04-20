import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sendEmail } from "@/lib/email"
import { errorTracker } from "@/lib/monitoring/error-tracking"

type EmailContent = { subject: string; html: string; text: string }

const SITE = "https://www.freshstart-il.com"

function getEmailContent(step: number, email: string): EmailContent | null {
  const cta = `<p><a href="${SITE}" style="color:#2563eb;">Visit FreshStart IL →</a></p>`
  const pricingCta = `<p style="margin-top:16px"><a href="${SITE}/pricing" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;">Get started — $299/year →</a></p>`

  switch (step) {
    case 1:
      return {
        subject: "Your Illinois Divorce Checklist is here",
        text: `Here's your Illinois Divorce Checklist — a step-by-step overview of what you'll need to file in Illinois.\n\nWhen you're ready to go further, FreshStart IL generates your complete divorce packet for you: petition, financial affidavit, and parenting plan — court-ready, no attorney required.\n\nSee how it works: ${SITE}/pricing`,
        html: `<p>Here's your <strong>Illinois Divorce Checklist</strong> — a step-by-step overview of what you'll need to file.</p><p>When you're ready to go further, FreshStart IL generates your complete divorce packet for you: petition, financial affidavit, and parenting plan — court-ready, without an attorney.</p>${pricingCta}`,
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
        text: `In Illinois, if your spouse is unresponsive, you can request a default judgment after 30 days. Document everything. File on time. Don't let delays drag this out. FreshStart IL can help you stay on track — $299/year, no attorney required. Visit freshstart-il.com/pricing`,
        html: `<p>If your spouse isn't responding, you're not stuck.</p><p>In Illinois, you can request a <strong>default judgment</strong> after 30 days of non-response. The key is filing correctly and on time.</p><p>Tips to keep things moving:<br>• Document every communication attempt<br>• File a Summons if they won't respond<br>• Don't miss your court dates</p><p>FreshStart IL generates every required form and walks you through each step.</p>${pricingCta}`,
      }
    case 5:
      return {
        subject: "Ready to file? Your documents are waiting.",
        text: `It's been a month since you downloaded our checklist. If you're ready to move forward, FreshStart IL generates your petition, financial affidavit, and parenting plan — Illinois court-ready, no attorney required. $299/year. Start today: freshstart-il.com/pricing`,
        html: `<p>It's been a month since you grabbed our checklist.</p><p>If you're ready to move forward, here's what FreshStart IL does for you:</p><ul><li>Auto-generates your Illinois divorce petition</li><li>Builds your Financial Affidavit from your answers</li><li>Creates a court-ready Parenting Plan (if you have children)</li><li>Guides you through e-filing, county by county</li></ul><p><strong>$299/year. No attorney required.</strong></p>${pricingCta}`,
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
        const msg = `[drip] Failed to send step ${record.step} to ${record.email}: ${result.error}`
        console.error(msg)
        errorTracker.captureMessage(msg, "error", {
          path: "/api/drip/send",
          email: record.email,
          step: record.step,
          sequence: record.sequence,
          dripEmailId: record.id,
        })
        failed++
      }
    } catch (err) {
      console.error(`[drip] Exception sending step ${record.step} to ${record.email}:`, err)
      errorTracker.captureError(err instanceof Error ? err : new Error(String(err)), {
        path: "/api/drip/send",
        email: record.email,
        step: record.step,
        sequence: record.sequence,
        dripEmailId: record.id,
      })
      failed++
    }
  }

  return NextResponse.json({ sent, failed, total: due.length })
}
