import nodemailer from "nodemailer"
import { escapeHtml } from "@/lib/security/validation"

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

// For development, use console logging if SMTP is not configured
const isEmailConfigured = !!(
  process.env.SMTP_USER && process.env.SMTP_PASSWORD
)

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html: string
  text?: string
}) {
  if (!isEmailConfigured) {
    // In development, log email instead of sending
    console.log("📧 Email would be sent:")
    console.log("To:", to)
    console.log("Subject:", subject)
    console.log("Body:", text || html)
    return { success: true, message: "Email logged (SMTP not configured)" }
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML for text version
    })

    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Email sending error:", error)
    return { success: false, error: String(error) }
  }
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
) {
  const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/reset-password?token=${resetToken}`

  return sendEmail({
    to: email,
    subject: "Reset Your Password - FreshStart IL",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Reset Your Password</h2>
        <p>You requested to reset your password for your FreshStart IL account.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Reset Password
        </a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
          This link will expire in 1 hour. If you didn't request this, please ignore this email.
        </p>
      </div>
    `,
    text: `Reset Your Password\n\nClick this link to reset your password: ${resetUrl}\n\nThis link will expire in 1 hour.`,
  })
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/auth/verify-email?token=${token}`

  return sendEmail({
    to: email,
    subject: "Verify Your Email - FreshStart IL",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Verify Your Email Address</h2>
        <p>Thank you for signing up for FreshStart IL!</p>
        <p>Please verify your email address by clicking the button below:</p>
        <a href="${verifyUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Verify Email
        </a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6b7280;">${verifyUrl}</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
          This link will expire in 24 hours. If you didn't create an account, please ignore this email.
        </p>
      </div>
    `,
    text: `Verify Your Email\n\nClick this link to verify your email: ${verifyUrl}\n\nThis link will expire in 24 hours.`,
  })
}

export async function sendContactEmail({
  name,
  email,
  subject,
  message,
  category,
}: {
  name: string
  email: string
  subject: string
  message: string
  category?: string
}) {
  const supportEmail = process.env.SUPPORT_EMAIL || "support@freshstart-il.com"
  const categoryLabel = category ? `Category: ${category}\n` : ""

  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)
  const safeSubject = escapeHtml(subject)
  const safeCategory = category ? escapeHtml(category) : ""
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br>")

  // Email to support team
  const supportEmailResult = await sendEmail({
    to: supportEmail,
    subject: `Contact Form: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Contact Form Submission</h2>
        <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
          ${safeCategory ? `<p><strong>Category:</strong> ${safeCategory}</p>` : ""}
          <p><strong>Subject:</strong> ${safeSubject}</p>
        </div>
        <div style="background-color: #ffffff; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; margin: 16px 0;">
          <h3 style="color: #374151; margin-top: 0;">Message:</h3>
          <p style="white-space: pre-wrap; color: #4b5563;">${safeMessage}</p>
        </div>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
          You can reply directly to this email to respond to ${safeName}.
        </p>
      </div>
    `,
    text: `New Contact Form Submission\n\nName: ${name}\nEmail: ${email}\n${categoryLabel}Subject: ${subject}\n\nMessage:\n${message}\n\n---\nYou can reply directly to this email to respond to ${name}.`,
  })

  // Confirmation email to user
  const confirmationEmailResult = await sendEmail({
    to: email,
    subject: "We Received Your Message - FreshStart IL",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Thank You for Contacting Us</h2>
        <p>Hi ${safeName},</p>
        <p>We've received your message and will get back to you within 2-3 business days.</p>
        <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Your message:</strong></p>
          <p style="white-space: pre-wrap; color: #4b5563; margin-top: 8px;">${safeMessage}</p>
        </div>
        <p>If you have any urgent questions, please include "URGENT" in your subject line when you contact us.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
          This is an automated confirmation. Please do not reply to this email.
        </p>
      </div>
    `,
    text: `Thank You for Contacting Us\n\nHi ${name},\n\nWe've received your message and will get back to you within 2-3 business days.\n\nYour message:\n${message}\n\nIf you have any urgent questions, please include "URGENT" in your subject line when you contact us.\n\nThis is an automated confirmation. Please do not reply to this email.`,
  })

  return {
    supportEmail: supportEmailResult,
    confirmationEmail: confirmationEmailResult,
  }
}

/**
 * Deadline reminder email template for divorce case deadlines
 */
export function deadlineReminderTemplate({
  userName,
  deadlineTitle,
  dueDate,
  daysRemaining,
  dashboardLink,
}: {
  userName: string | null
  deadlineTitle: string
  dueDate: Date
  daysRemaining: number
  dashboardLink: string
}) {
  const formattedDate = dueDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const subject =
    daysRemaining <= 0
      ? `Overdue: ${deadlineTitle} - FreshStart IL`
      : daysRemaining === 1
      ? `Tomorrow: ${deadlineTitle} - FreshStart IL`
      : `${deadlineTitle} due in ${daysRemaining} days - FreshStart IL`

  const urgencyText =
    daysRemaining <= 0
      ? "This deadline has passed."
      : daysRemaining === 1
      ? "This deadline is tomorrow."
      : `This deadline is in ${daysRemaining} days.`

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Deadline Reminder - FreshStart IL</h2>
      <p>Hi ${userName || "there"},</p>
      <p>${urgencyText}</p>
      <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #2563eb;">
        <p style="margin: 0 0 8px 0;"><strong>${deadlineTitle}</strong></p>
        <p style="margin: 0; color: #4b5563;">Due: ${formattedDate}</p>
      </div>
      <p>
        <a href="${dashboardLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          View Case Dashboard
        </a>
      </p>
      <p style="color: #6b7280; font-size: 14px;">
        This is an automated reminder from FreshStart IL. Keep your case on track by checking your dashboard regularly.
      </p>
    </div>
  `

  const text = `Deadline Reminder - FreshStart IL

Hi ${userName || "there"},

${urgencyText}

${deadlineTitle}
Due: ${formattedDate}

View your case dashboard: ${dashboardLink}

This is an automated reminder from FreshStart IL.`

  return { subject, html, text }
}

/**
 * Payment failed email - notifies user and provides link to update payment method
 */
export async function sendPaymentFailedEmail({
  to,
  portalUrl,
}: {
  to: string
  portalUrl: string
}) {
  const safePortalUrl = escapeHtml(portalUrl)

  return sendEmail({
    to,
    subject: "Your Payment Failed - FreshStart IL",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Payment Failed</h2>
        <p>We were unable to process your subscription payment. This may be due to an expired card, insufficient funds, or another billing issue.</p>
        <p>Please update your payment method to avoid any interruption to your FreshStart IL subscription:</p>
        <a href="${safePortalUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Update Payment Method
        </a>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6b7280;">${safePortalUrl}</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
          If you have questions or believe this is an error, please contact us at ${process.env.SUPPORT_EMAIL || "support@freshstart-il.com"}.
        </p>
      </div>
    `,
    text: `Payment Failed - FreshStart IL

We were unable to process your subscription payment. This may be due to an expired card, insufficient funds, or another billing issue.

Please update your payment method: ${portalUrl}

If you have questions or believe this is an error, please contact us at ${process.env.SUPPORT_EMAIL || "support@freshstart-il.com"}.`,
  })
}

/**
 * Lead magnet — delivers the Illinois Divorce Checklist to new subscribers.
 * BCCs support so every lead is captured in the inbox automatically.
 */
export async function sendChecklistEmail(email: string) {
  const appUrl = process.env.NEXTAUTH_URL || "https://www.freshstart-il.com"
  const supportEmail = process.env.SUPPORT_EMAIL || "support@freshstart-il.com"
  const safeEmail = escapeHtml(email)

  return sendEmail({
    to: email,
    subject: "Your Illinois Divorce Checklist — FreshStart IL",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #1f2937;">
        <div style="background-color: #2563eb; padding: 24px 32px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 22px;">FreshStart IL</h1>
          <p style="color: #bfdbfe; margin: 4px 0 0 0; font-size: 14px;">Illinois Divorce Guidance</p>
        </div>

        <div style="background: white; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">Your Illinois Divorce Checklist</h2>
          <p style="color: #4b5563;">Here's everything you need to file for divorce in Illinois — in one place. Bookmark this email or print it as your reference guide.</p>

          <!-- Section 1: Required Forms -->
          <div style="background: #f0f9ff; border-left: 4px solid #2563eb; padding: 16px 20px; border-radius: 4px; margin: 24px 0;">
            <h3 style="margin: 0 0 12px 0; color: #1e40af; font-size: 16px;">✅ 4 Forms Required for Every Illinois Divorce</h3>
            <ol style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.8;">
              <li><strong>Petition for Dissolution of Marriage</strong> — starts the case</li>
              <li><strong>Financial Affidavit</strong> — your income, expenses, assets, debts (short or long form based on income)</li>
              <li><strong>Parenting Plan</strong> — required if you have children; covers custody, visitation, decision-making</li>
              <li><strong>Marital Settlement Agreement</strong> — your agreed-upon division of property and debt</li>
            </ol>
            <p style="color: #6b7280; font-size: 13px; margin: 12px 0 0 0;">FreshStart IL generates all 4 automatically from your answers.</p>
          </div>

          <!-- Section 2: County Filing Fees -->
          <div style="margin: 24px 0;">
            <h3 style="color: #1f2937; font-size: 16px; margin-bottom: 12px;">💰 County Filing Fees (2026)</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="background: #f9fafb;">
                  <th style="text-align: left; padding: 8px 12px; border: 1px solid #e5e7eb; color: #374151;">County</th>
                  <th style="text-align: right; padding: 8px 12px; border: 1px solid #e5e7eb; color: #374151;">Filing Fee</th>
                  <th style="text-align: center; padding: 8px 12px; border: 1px solid #e5e7eb; color: #374151;">E-Filing</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">Cook County</td>
                  <td style="text-align: right; padding: 8px 12px; border: 1px solid #e5e7eb;">$388</td>
                  <td style="text-align: center; padding: 8px 12px; border: 1px solid #e5e7eb;">Required</td>
                </tr>
                <tr style="background: #f9fafb;">
                  <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">DuPage County</td>
                  <td style="text-align: right; padding: 8px 12px; border: 1px solid #e5e7eb;">$349</td>
                  <td style="text-align: center; padding: 8px 12px; border: 1px solid #e5e7eb;">Required</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">Will County</td>
                  <td style="text-align: right; padding: 8px 12px; border: 1px solid #e5e7eb;">$299</td>
                  <td style="text-align: center; padding: 8px 12px; border: 1px solid #e5e7eb;">Available</td>
                </tr>
                <tr style="background: #f9fafb;">
                  <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">Lake County</td>
                  <td style="text-align: right; padding: 8px 12px; border: 1px solid #e5e7eb;">~$350</td>
                  <td style="text-align: center; padding: 8px 12px; border: 1px solid #e5e7eb;">Required</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">Kane County</td>
                  <td style="text-align: right; padding: 8px 12px; border: 1px solid #e5e7eb;">~$280</td>
                  <td style="text-align: center; padding: 8px 12px; border: 1px solid #e5e7eb;">Available</td>
                </tr>
              </tbody>
            </table>
            <p style="color: #6b7280; font-size: 12px; margin: 8px 0 0 0;">+ $50–75 for service of process · + $50 parenting class if you have children</p>
          </div>

          <!-- Section 3: Key Deadlines -->
          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px 20px; border-radius: 4px; margin: 24px 0;">
            <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px;">⏰ Key Deadlines — Don't Miss These</h3>
            <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.8;">
              <li><strong>90-day residency:</strong> You or your spouse must have lived in Illinois for 90 days before filing</li>
              <li><strong>Service of process:</strong> After filing, serve your spouse within 30 days (or they must waive service)</li>
              <li><strong>Response window:</strong> Your spouse has 30 days to respond after being served</li>
              <li><strong>Parenting class:</strong> Must be completed before the final hearing if you have children</li>
            </ul>
          </div>

          <!-- Section 4: What Courts Reject -->
          <div style="margin: 24px 0;">
            <h3 style="color: #1f2937; font-size: 16px; margin-bottom: 12px;">❌ Most Common Reasons Courts Reject Filings</h3>
            <ul style="margin: 0; padding-left: 20px; color: #374151; line-height: 1.8;">
              <li>Financial Affidavit not notarized (required in all counties)</li>
              <li>Wrong county heading on documents</li>
              <li>Case number format incorrect (Cook vs. other counties differ)</li>
              <li>Parenting Plan missing required statutory provisions</li>
              <li>Petition not signed or missing required fields</li>
            </ul>
          </div>

          <!-- Section 5: E-Filing -->
          <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px 20px; border-radius: 4px; margin: 24px 0;">
            <h3 style="margin: 0 0 8px 0; color: #14532d; font-size: 16px;">💻 E-Filing in Illinois</h3>
            <p style="color: #374151; margin: 0 0 8px 0;">Most Illinois counties now require e-filing through <strong>e-fileIL.com</strong> (Tyler Technologies).</p>
            <p style="color: #374151; margin: 0;">You'll need to create an e-fileIL account, upload your documents as PDF, and pay the filing fee by credit card. The clerk reviews and either accepts or returns your filing within 1–3 business days.</p>
          </div>

          <!-- CTA -->
          <div style="text-align: center; margin: 32px 0 24px 0; padding: 24px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
            <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0;">
              <strong>Ready to generate your court forms automatically?</strong><br>
              <span style="color: #6b7280; font-size: 14px;">FreshStart IL generates all 4 required forms from plain-English questions. 7-day free trial.</span>
            </p>
            <a href="${appUrl}/auth/signup" style="display: inline-block; background-color: #2563eb; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
              Start Free 7-Day Trial →
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
            FreshStart IL · Illinois Divorce Guidance · <a href="${appUrl}" style="color: #9ca3af;">${appUrl.replace("https://", "")}</a><br>
            Questions? Reply to this email or contact <a href="mailto:${supportEmail}" style="color: #9ca3af;">${supportEmail}</a><br>
            <em>This checklist is general information, not legal advice. Consult an Illinois attorney for complex situations.</em>
          </p>
        </div>
      </div>
    `,
    text: `Illinois Divorce Checklist — FreshStart IL

4 REQUIRED FORMS FOR EVERY ILLINOIS DIVORCE:
1. Petition for Dissolution of Marriage
2. Financial Affidavit (short or long form)
3. Parenting Plan (if you have children)
4. Marital Settlement Agreement

COUNTY FILING FEES:
Cook County: $388 (e-filing required)
DuPage County: $349 (e-filing required)
Will County: ~$299 (e-filing available)
Lake County: ~$350 (e-filing required)
Kane County: ~$280 (e-filing available)
+ $50-75 service of process + $50 parenting class if you have kids

KEY DEADLINES:
- 90-day IL residency before filing
- Serve spouse within 30 days of filing
- Spouse has 30 days to respond
- Parenting class before final hearing (if kids)

MOST COMMON REJECTION REASONS:
- Financial Affidavit not notarized
- Wrong county heading
- Case number format incorrect
- Parenting Plan missing required provisions

E-FILING: Most counties require e-filing via e-fileIL.com. Create an account, upload PDFs, pay by card.

Start your free 7-day trial at FreshStart IL: ${appUrl}/auth/signup

---
This checklist is general information, not legal advice.
Questions? ${supportEmail}`,
  })
}

export async function sendDeadlineReminderEmail({
  to,
  userName,
  deadlineTitle,
  dueDate,
  daysRemaining,
  dashboardLink,
}: {
  to: string
  userName: string | null
  deadlineTitle: string
  dueDate: Date
  daysRemaining: number
  dashboardLink: string
}) {
  const template = deadlineReminderTemplate({
    userName,
    deadlineTitle,
    dueDate,
    daysRemaining,
    dashboardLink,
  })
  return sendEmail({
    to,
    subject: template.subject,
    html: template.html,
    text: template.text,
  })
}
