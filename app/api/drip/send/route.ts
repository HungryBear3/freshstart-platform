import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sendEmail } from "@/lib/email"
import { errorTracker } from "@/lib/monitoring/error-tracking"

type EmailContent = { subject: string; html: string; text: string }

const SITE = "https://www.freshstart-il.com"

function getEmailContent(step: number): EmailContent | null {
  const pricingCta = `<p style="margin-top:16px"><a href="${SITE}/pricing" style="display:inline-block;background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;">Start $149 one-time / 60-day access →</a></p>`
  const accessWindow = "The one-time purchase includes 60 days of service access."
  const boundaryText = "FreshStart IL is not a law firm and does not provide legal advice."
  const boundaryHtml = `<p style="font-size:12px;color:#64748b;">${boundaryText}</p>`

  switch (step) {
    case 1:
      return {
        subject: "Your general Illinois Divorce Checklist is here",
        text: `Here's your general Illinois Divorce Checklist. It can help you organize information and identify questions to verify before filing. When you're ready, FreshStart IL prepares supported uncontested-divorce form drafts from your answers for $149 one-time. ${accessWindow} You review and file them.\n\n${boundaryText}\n\nSee how it works: ${SITE}/pricing`,
        html: `<p>Here's your <strong>general Illinois Divorce Checklist</strong>. It can help you organize information and identify questions to verify before filing.</p><p>When you're ready, FreshStart IL prepares supported uncontested-divorce form drafts from your answers for <strong>$149 one-time</strong>. ${accessWindow} You review and file them.</p>${boundaryHtml}${pricingCta}`,
      }
    case 2:
      return {
        subject: "Before you prepare Illinois divorce forms",
        text: `Forms and filing requirements can vary with your facts and circuit. Check the current instructions from your circuit clerk, review every draft, and ask a licensed Illinois attorney about legal questions specific to your situation.\n\n${boundaryText}\n\nGeneral information: ${SITE}/legal`,
        html: `<p>Forms and filing requirements can vary with your facts and circuit.</p><ul><li>Check the current instructions from your circuit clerk.</li><li>Review every draft before you sign or file it.</li><li>Ask a licensed Illinois attorney about legal questions specific to your situation.</li></ul>${boundaryHtml}<p><a href="${SITE}/legal" style="color:#2563eb;">Read general legal information →</a></p>`,
      }
    case 3:
      return {
        subject: "Official Illinois court forms are free",
        text: `Official court forms are available free from Illinois Courts and circuit-clerk websites. FreshStart IL's $149 one-time charge is for document-preparation software and filing guidance, not for the blank government forms. ${accessWindow} You review and file your documents.\n\n${boundaryText}\n\nSee the service: ${SITE}/pricing`,
        html: `<p><strong>Official court forms are available free</strong> from Illinois Courts and circuit-clerk websites.</p><p>FreshStart IL's <strong>$149 one-time</strong> charge is for document-preparation software and filing guidance, not for the blank government forms. ${accessWindow} You review and file your documents.</p>${boundaryHtml}${pricingCta}`,
      }
    case 4:
      return {
        subject: "If your uncontested case changes",
        text: `FreshStart IL is designed for supported uncontested-divorce document preparation. ${accessWindow} If your spouse contests an issue, your facts change, or you're unsure what to file, pause and verify the next step with your circuit clerk or a licensed Illinois attorney.\n\n${boundaryText}\n\nLearn what the service includes: ${SITE}/pricing`,
        html: `<p>FreshStart IL is designed for supported uncontested-divorce document preparation. ${accessWindow}</p><p>If your spouse contests an issue, your facts change, or you're unsure what to file, pause and verify the next step with your circuit clerk or a licensed Illinois attorney.</p>${boundaryHtml}${pricingCta}`,
      }
    case 5:
      return {
        subject: "Ready to prepare your form drafts?",
        text: `FreshStart IL prepares supported uncontested-divorce form drafts from your answers and provides general filing guidance for $149 one-time, with no subscription. ${accessWindow} You review every draft, verify current circuit-clerk requirements, and file the documents yourself.\n\n${boundaryText}\n\nSee the service: ${SITE}/pricing`,
        html: `<p>FreshStart IL prepares supported uncontested-divorce form drafts from your answers and provides general filing guidance for <strong>$149 one-time</strong>, with no subscription. ${accessWindow}</p><p>You review every draft, verify current circuit-clerk requirements, and file the documents yourself.</p>${boundaryHtml}${pricingCta}`,
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
    const content = getEmailContent(record.step)
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
