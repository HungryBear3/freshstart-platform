import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { sendContactEmail } from "@/lib/email"
import { rateLimit, getClientIdentifier } from "@/lib/rate-limit"

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(3, "Subject must be at least 3 characters").max(200, "Subject must be less than 200 characters"),
  message: z.string().min(10, "Message must be at least 10 characters").max(5000, "Message must be less than 5000 characters"),
  category: z.enum(["general", "legal-question", "technical-issue", "billing", "other"]).optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 requests per 15 minutes per IP
    const clientId = getClientIdentifier(request)
    const limit = rateLimit(clientId, 5, 15 * 60 * 1000)

    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const validatedData = contactFormSchema.parse(body)

    // Send emails
    const result = await sendContactEmail({
      name: validatedData.name,
      email: validatedData.email,
      subject: validatedData.subject,
      message: validatedData.message,
      category: validatedData.category,
    })

    // Check if emails were sent successfully
    if (!result.supportEmail.success || !result.confirmationEmail.success) {
      console.error("Email sending failed:", {
        supportEmail: result.supportEmail,
        confirmationEmail: result.confirmationEmail,
      })
      return NextResponse.json(
        {
          error: "Failed to send email. Please try again later.",
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: "Your message has been sent successfully. We'll get back to you within 2-3 business days.",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Invalid input data" },
        { status: 400 }
      )
    }

    console.error("Contact form error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    )
  }
}
