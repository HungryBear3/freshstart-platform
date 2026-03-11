import { stripe } from "./config"
import Stripe from "stripe"

// Lazy import Prisma from shared client (same pattern as register route)
async function getPrisma() {
  try {
    const { prisma } = await import("@/lib/db")
    if (!prisma) {
      throw new Error("Prisma client is undefined after import")
    }
    return prisma
  } catch (error: any) {
    console.error("[Stripe] === Prisma Import Error ===")
    console.error("[Stripe] Error message:", error?.message)
    console.error("[Stripe] Error code:", error?.code)
    console.error("[Stripe] Error stack:", error?.stack)
    console.error("[Stripe] ===========================")
    
    const errorMsg = error?.message || String(error)
    const errorCode = error?.code || ""
    
    if (
      errorMsg.includes("Cannot find module") || 
      errorMsg.includes(".prisma/client") || 
      errorMsg.includes("@prisma/client") ||
      errorCode === "MODULE_NOT_FOUND"
    ) {
      throw new Error(`Prisma client not found. Error: ${errorMsg}. Run: npm run db:generate`)
    }
    
    throw new Error(`Database client not available: ${errorMsg} (code: ${errorCode})`)
  }
}

/**
 * Get or create a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string
): Promise<Stripe.Customer> {
  let prisma: any = null
  
  // Try to get Prisma client, but don't fail if it's not available
  try {
    prisma = await getPrisma()
    console.log("[Stripe] Prisma client obtained successfully")
  } catch (prismaError: any) {
    console.warn("[Stripe] Could not get Prisma client, will create customer in Stripe only:", prismaError.message)
    // Continue without Prisma - we'll create the customer in Stripe anyway
  }

  // Check if user already has a Stripe customer ID (only if Prisma is available)
  if (prisma) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { userId },
        select: { stripeCustomerId: true },
      })

      if (subscription?.stripeCustomerId) {
        // Retrieve existing customer
        try {
          const customer = await stripe.customers.retrieve(subscription.stripeCustomerId)
          if (customer.deleted) {
            throw new Error("Stripe customer was deleted")
          }
          console.log("[Stripe] Retrieved existing customer:", customer.id)
          return customer as Stripe.Customer
        } catch (retrieveError: any) {
          // If customer doesn't exist in Stripe, create a new one
          console.warn("[Stripe] Customer not found in Stripe, creating new one:", retrieveError.message)
        }
      }
    } catch (dbQueryError: any) {
      console.warn("[Stripe] Database query failed, will create new customer:", dbQueryError.message)
      // Continue to create new customer
    }
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  })

  console.log("[Stripe] Created customer:", customer.id)

  // Save customer ID to database (only if Prisma is available)
  if (prisma) {
    try {
      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          stripeCustomerId: customer.id,
          status: "incomplete",
          plan: "annual",
        },
        update: {
          stripeCustomerId: customer.id,
        },
      })
      console.log("[Stripe] Saved customer ID to database")
    } catch (dbError: any) {
      // If database error, log it but don't fail - customer is created in Stripe
      console.error("[Stripe] Database error saving customer:", dbError)
      if (dbError.message?.includes("does not exist") || dbError.message?.includes("relation") || dbError.code === "P2021") {
        console.warn("[Stripe] Database table may not exist. Customer created in Stripe, but not saved to database.")
        // Don't throw - customer exists in Stripe and can be saved later via webhook
      }
      // Continue anyway - customer exists in Stripe
    }
  } else {
    console.warn("[Stripe] Prisma not available - customer created in Stripe but not saved to database")
  }

  return customer
}
