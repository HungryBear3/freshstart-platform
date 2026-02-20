import nodemailer from "nodemailer"

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

  // Email to support team
  const supportEmailResult = await sendEmail({
    to: supportEmail,
    subject: `Contact Form: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">New Contact Form Submission</h2>
        <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          ${category ? `<p><strong>Category:</strong> ${category}</p>` : ""}
          <p><strong>Subject:</strong> ${subject}</p>
        </div>
        <div style="background-color: #ffffff; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; margin: 16px 0;">
          <h3 style="color: #374151; margin-top: 0;">Message:</h3>
          <p style="white-space: pre-wrap; color: #4b5563;">${message.replace(/\n/g, "<br>")}</p>
        </div>
        <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
          You can reply directly to this email to respond to ${name}.
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
        <p>Hi ${name},</p>
        <p>We've received your message and will get back to you within 2-3 business days.</p>
        <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;"><strong>Your message:</strong></p>
          <p style="white-space: pre-wrap; color: #4b5563; margin-top: 8px;">${message.replace(/\n/g, "<br>")}</p>
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
