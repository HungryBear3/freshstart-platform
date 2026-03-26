import { resend, FROM_EMAIL } from "./resend"
import { escapeHtml } from "@/lib/security/validation"

const isResendConfigured = !!process.env.RESEND_API_KEY

export async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html: string; text?: string }) {
  if (!isResendConfigured) {
    console.log("[resend] RESEND_API_KEY not set – emails disabled")
    console.log("📧 Email would be sent:")
    console.log("To:", to)
    console.log("Subject:", subject)
    console.log("Body:", text || html)
    return { success: true, message: "Email logged (RESEND not configured)" }
  }

  try {
    const { error } = await resend!.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text,
    })
    if (error) throw new Error(error.message)
    return { success: true }
  } catch (error) {
    console.error("Email sending error:", error)
    return { success: false, error: String(error) }
  }
}
