import { resend, FROM_EMAIL } from "./resend"
import { escapeHtml } from "@/lib/security/validation"
import { buildChecklistEmail } from "./email/checklist-content"

export { buildChecklistEmail } from "./email/checklist-content"

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

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/reset-password?token=${resetToken}`
  return sendEmail({
    to: email,
    subject: "Reset Your Password - FreshStart IL",
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><h2 style="color:#2563eb">Reset Your Password</h2><p>Click the button below to reset your password:</p><a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin:16px 0">Reset Password</a><p style="color:#6b7280;font-size:14px">This link expires in 1 hour.</p></div>`,
    text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour.`,
  })
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/verify-email?token=${token}`
  return sendEmail({
    to: email,
    subject: "Verify Your Email - FreshStart IL",
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><h2 style="color:#2563eb">Verify Your Email</h2><p>Click to verify your email address:</p><a href="${verifyUrl}" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin:16px 0">Verify Email</a><p style="color:#6b7280;font-size:14px">This link expires in 24 hours.</p></div>`,
    text: `Verify your email: ${verifyUrl}\n\nThis link expires in 24 hours.`,
  })
}

export async function sendContactEmail({ name, email, subject, message, category }: { name: string; email: string; subject: string; message: string; category?: string }) {
  const supportEmail = process.env.SUPPORT_EMAIL || "support@freshstart-il.com"
  const safeName = escapeHtml(name)
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>")
  const supportEmailResult = await sendEmail({
    to: supportEmail,
    subject: `Contact Form: ${subject}`,
    html: `<div style="font-family:Arial,sans-serif"><h2>New Contact Form</h2><p><strong>From:</strong> ${safeName} &lt;${email}&gt;</p>${category ? `<p><strong>Category:</strong> ${category}</p>` : ""}<p><strong>Message:</strong></p><p>${safeMessage}</p></div>`,
    text: `From: ${name} <${email}>\n${category ? `Category: ${category}\n` : ""}Message:\n${message}`,
  })
  const confirmationEmailResult = await sendEmail({
    to: email,
    subject: "We Received Your Message - FreshStart IL",
    html: `<div style="font-family:Arial,sans-serif"><h2>Thank You for Contacting Us</h2><p>Hi ${safeName}, we'll get back to you within 2-3 business days.</p></div>`,
    text: `Hi ${name},\n\nWe received your message and will respond within 2-3 business days.`,
  })
  return { supportEmail: supportEmailResult, confirmationEmail: confirmationEmailResult }
}

export async function sendChecklistEmail(email: string) {
  const appUrl = process.env.NEXTAUTH_URL || "https://www.freshstart-il.com"
  return sendEmail({
    to: email,
    ...buildChecklistEmail(appUrl),
  })
}

export async function sendPaymentFailedEmail({ to, portalUrl }: { to: string; portalUrl: string }) {
  return sendEmail({
    to,
    subject: "Your Payment Failed - FreshStart IL",
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><h2 style="color:#dc2626">Payment Failed</h2><p>We couldn't process your payment. Please update your payment method:</p><a href="${portalUrl}" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin:16px 0">Update Payment Method</a></div>`,
    text: `Payment failed. Update your payment method: ${portalUrl}`,
  })
}

export async function sendDeadlineReminderEmail({ to, userName, deadlineTitle, dueDate, daysRemaining, dashboardLink }: { to: string; userName: string | null; deadlineTitle: string; dueDate: Date; daysRemaining: number; dashboardLink: string }) {
  const formattedDate = dueDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
  const urgencyText = daysRemaining <= 0 ? "This deadline has passed." : daysRemaining === 1 ? "This deadline is tomorrow." : `This deadline is in ${daysRemaining} days.`
  const subject = daysRemaining <= 0 ? `Overdue: ${deadlineTitle}` : daysRemaining === 1 ? `Tomorrow: ${deadlineTitle}` : `${deadlineTitle} due in ${daysRemaining} days`
  return sendEmail({
    to,
    subject: `${subject} - FreshStart IL`,
    html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto"><h2>Deadline Reminder</h2><p>Hi ${userName || "there"},</p><p>${urgencyText}</p><div style="background:#f9fafb;padding:16px;border-radius:8px;border-left:4px solid #2563eb"><p><strong>${deadlineTitle}</strong></p><p>Due: ${formattedDate}</p></div><p><a href="${dashboardLink}" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin:16px 0">View Dashboard</a></p></div>`,
    text: `${urgencyText}\n\n${deadlineTitle}\nDue: ${formattedDate}\n\nView dashboard: ${dashboardLink}`,
  })
}
