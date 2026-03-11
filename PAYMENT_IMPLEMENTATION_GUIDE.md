# Payment Implementation Guide

This guide outlines everything needed to start accepting payments from users for the NewStart IL platform.

## Overview

To accept payments, you'll need to:
1. **Set up business entity** (LLC/Corp recommended - see Business Setup section)
2. Choose a payment processor (Stripe recommended)
3. Set up database models for subscriptions/payments
4. Create API routes for payment processing
5. Implement webhook handlers for payment events
6. Build payment UI components
7. Add subscription management features

---

## 0. Business Setup (IMPORTANT - Do This First)

### Should You Incorporate Before Opening Stripe?

**✅ RECOMMENDED: Incorporate First**

For a legal services platform like NewStart IL, incorporating before opening Stripe is strongly recommended:

**Why Incorporate First:**
- **Liability Protection**: Legal services carry risk - LLC/Corp protects personal assets
- **Clean Setup**: Avoid account transfer complications later
- **Tax Benefits**: Business expenses are deductible, cleaner tax separation
- **Professional Image**: Business name on invoices and statements
- **Stripe Transfer Limitations**: Not all account data transfers cleanly

**If You Must Start Quickly:**
- You CAN start with a personal Stripe account for MVP/testing
- But plan to incorporate and transfer within 30-60 days
- Transfer process requires Stripe support ticket and may have limitations

### Incorporation Steps

**1. Choose Business Structure:**
- **LLC** (Recommended for most): Simple, flexible, pass-through taxation
- **S-Corp**: Tax benefits if you'll have significant income
- **C-Corp**: If you plan to raise investment capital

**2. Choose State:**
- **Delaware**: Business-friendly, well-established law
- **Wyoming**: Low fees, privacy-friendly
- **Nevada**: No state income tax
- **Your Home State**: Simplest, but may have higher taxes/fees

**3. Formation Process:**
1. File Articles of Incorporation/Organization
2. Get EIN from IRS (free, takes ~5 minutes online)
3. Open business bank account (required for Stripe)
4. Get registered agent service (if incorporating out of state)
5. File annual reports as required by state

**4. Estimated Costs:**
- LLC Formation: $50-500 (state fees + service if using)
- Registered Agent: $50-200/year
- Business Bank Account: Usually free
- Total First Year: ~$200-700

**5. Timeline:**
- Fastest: 1-2 weeks (using formation service)
- DIY: 2-4 weeks (filing yourself)

### Stripe Business Account Requirements

Once incorporated, you'll need:
- **Business Name**: As registered with state
- **EIN**: Tax ID number from IRS
- **Business Address**: Physical address (not P.O. Box)
- **Business Bank Account**: For payouts
- **Business Type**: LLC, Corporation, etc.
- **Business Description**: What your company does

**Note**: Stripe requires business verification, which can take 1-3 business days.

---

## 1. Choose Payment Processor

### Recommended: Stripe

**Why Stripe?**
- ✅ Excellent Next.js integration
- ✅ Handles PCI compliance automatically
- ✅ Supports subscriptions, one-time payments, and trials
- ✅ Great documentation and developer experience
- ✅ Built-in webhook system
- ✅ Test mode for development

**Alternatives:**
- PayPal (good for international, but more complex)
- Paddle (good for SaaS, handles tax automatically)
- Square (good for in-person, less ideal for SaaS)

**Stripe Pricing:**
- 2.9% + $0.30 per successful card charge
- No monthly fees
- Free for first $1M in revenue (Stripe Atlas)

---

## 2. Database Schema Updates

Add subscription and payment models to `prisma/schema.prisma`:

```prisma
// Add to User model
model User {
  // ... existing fields ...
  subscription Subscription?
  payments     Payment[]
}

// Subscription model
model Subscription {
  id                String   @id @default(cuid())
  userId            String   @unique
  stripeCustomerId  String?  @unique
  stripeSubscriptionId String? @unique
  stripePriceId     String?
  status            String   // "active", "canceled", "past_due", "trialing", "incomplete"
  plan              String   // "annual", "monthly", etc.
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  cancelAtPeriodEnd  Boolean @default(false)
  trialStart         DateTime?
  trialEnd           DateTime?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("subscriptions")
}

// Payment model (for payment history)
model Payment {
  id                String   @id @default(cuid())
  userId            String
  stripePaymentIntentId String? @unique
  stripeInvoiceId   String? @unique
  amount            Decimal  @db.Decimal(10, 2)
  currency           String   @default("usd")
  status            String   // "succeeded", "pending", "failed", "refunded"
  description        String?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("payments")
}
```

**Migration Steps:**
```bash
# Generate migration
npx prisma migrate dev --name add-subscriptions

# Or apply to production
npx prisma migrate deploy
```

---

## 3. Install Dependencies

```bash
npm install stripe @stripe/stripe-js
npm install --save-dev @types/stripe
```

---

## 4. Environment Variables

Add to `.env.local` (and Vercel dashboard):

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_... # Test key for development
STRIPE_PUBLISHABLE_KEY=pk_test_... # Public key for frontend
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook secret (get from Stripe dashboard)

# Pricing
ANNUAL_PRICE_ID=price_... # Stripe Price ID for annual plan
MONTHLY_PRICE_ID=price_... # Stripe Price ID for monthly plan (if offering)

# App URL (for webhooks)
NEXT_PUBLIC_APP_URL=http://localhost:3000 # Local
# NEXT_PUBLIC_APP_URL=https://your-domain.com # Production
```

**Getting Stripe Keys:**
1. Sign up at https://stripe.com
2. Go to Developers → API keys
3. Copy "Publishable key" and "Secret key"
4. Use test keys for development, live keys for production

---

## 5. Stripe Setup Steps

### Step 1: Create Products and Prices in Stripe Dashboard

1. Go to Stripe Dashboard → Products
2. Create product: "NewStart IL Annual Subscription"
3. Set price: $299/year
4. Enable "Recurring" billing
5. Copy the Price ID (starts with `price_...`)
6. Add to `.env.local` as `ANNUAL_PRICE_ID`

### Step 2: Configure Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `checkout.session.completed`
5. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

---

## 6. API Routes to Create

### `/api/stripe/create-checkout-session` (POST)
Creates a Stripe Checkout session for subscription

```typescript
// app/api/stripe/create-checkout-session/route.ts
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getCurrentUser } from "@/lib/auth/session"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { priceId } = await request.json()

    // Create or retrieve Stripe customer
    const customer = await getOrCreateStripeCustomer(user.id, user.email!)

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      subscription_data: {
        trial_period_days: 7, // 7-day free trial
      },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error: any) {
    console.error("Stripe checkout error:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

async function getOrCreateStripeCustomer(userId: string, email: string) {
  // Check if customer exists in database
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
    select: { stripeCustomerId: true },
  })

  if (subscription?.stripeCustomerId) {
    return await stripe.customers.retrieve(subscription.stripeCustomerId)
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  })

  // Save to database
  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId: customer.id,
      status: "incomplete",
    },
    update: {
      stripeCustomerId: customer.id,
    },
  })

  return customer
}
```

### `/api/webhooks/stripe` (POST)
Handles Stripe webhook events

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { prisma } from "@/lib/db"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
})

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  // Handle different event types
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
      break

    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionUpdate(event.data.object as Stripe.Subscription)
      break

    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
      break

    case "invoice.payment_succeeded":
      await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
      break

    case "invoice.payment_failed":
      await handlePaymentFailed(event.data.object as Stripe.Invoice)
      break
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string

  const subscription = await prisma.subscription.findUnique({
    where: { stripeCustomerId: customerId },
  })

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        stripeSubscriptionId: subscriptionId,
        status: "active",
      },
    })
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const sub = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
  })

  if (sub) {
    await prisma.subscription.update({
      where: { id: sub.id },
      data: {
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    })
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: "canceled",
    },
  })
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  })

  if (subscription) {
    await prisma.payment.create({
      data: {
        userId: subscription.userId,
        stripeInvoiceId: invoice.id,
        amount: invoice.amount_paid / 100, // Convert from cents
        currency: invoice.currency,
        status: "succeeded",
        description: invoice.description || "Subscription payment",
      },
    })
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Handle failed payment - maybe send email notification
  console.error("Payment failed for invoice:", invoice.id)
}
```

### `/api/stripe/create-portal-session` (POST)
Creates customer portal session for managing subscription

```typescript
// app/api/stripe/create-portal-session/route.ts
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getCurrentUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
})

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    })

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 404 }
      )
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error("Portal session error:", error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

---

## 7. Frontend Components

### Update Pricing Page with Checkout Button

```typescript
// app/pricing/page.tsx - Add to the pricing card
import { loadStripe } from "@stripe/stripe-js"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

async function handleCheckout() {
  const stripe = await stripePromise
  const response = await fetch("/api/stripe/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      priceId: process.env.NEXT_PUBLIC_ANNUAL_PRICE_ID,
    }),
  })

  const { sessionId } = await response.json()
  const result = await stripe?.redirectToCheckout({ sessionId })

  if (result?.error) {
    console.error(result.error.message)
  }
}
```

### Subscription Status Component

```typescript
// components/subscription/subscription-status.tsx
import { getCurrentUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db"

export async function SubscriptionStatus() {
  const user = await getCurrentUser()
  if (!user) return null

  const subscription = await prisma.subscription.findUnique({
    where: { userId: user.id },
  })

  if (!subscription) {
    return <div>No active subscription</div>
  }

  return (
    <div>
      <p>Status: {subscription.status}</p>
      <p>Plan: {subscription.plan}</p>
      {subscription.currentPeriodEnd && (
        <p>Renews: {subscription.currentPeriodEnd.toLocaleDateString()}</p>
      )}
    </div>
  )
}
```

---

## 8. Middleware for Protected Routes

Update middleware to check subscription status:

```typescript
// middleware.ts
import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db"

export async function middleware(request: NextRequest) {
  const user = await getCurrentUser()

  // Check if route requires subscription
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!user) {
      return NextResponse.redirect(new URL("/auth/signin", request.url))
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id },
    })

    if (!subscription || subscription.status !== "active") {
      return NextResponse.redirect(new URL("/pricing", request.url))
    }
  }

  return NextResponse.next()
}
```

---

## 9. Testing

### Test Mode
1. Use Stripe test keys (`sk_test_...`, `pk_test_...`)
2. Use test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - 3D Secure: `4000 0025 0000 3155`
3. Use any future expiry date and any CVC

### Webhook Testing
1. Use Stripe CLI for local testing:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
2. Trigger test events:
   ```bash
   stripe trigger checkout.session.completed
   ```

---

## 10. Security Considerations

1. **Never expose secret keys** - Only use publishable key in frontend
2. **Verify webhook signatures** - Always verify Stripe webhook signatures
3. **Use HTTPS** - Required for production
4. **Validate user ownership** - Always verify user owns subscription before operations
5. **Rate limiting** - Add rate limiting to payment endpoints
6. **Logging** - Log all payment events for audit trail

---

## 11. Production Checklist

- [ ] Switch to live Stripe keys
- [ ] Update webhook endpoint URL in Stripe dashboard
- [ ] Test complete payment flow end-to-end
- [ ] Set up email notifications for payment events
- [ ] Configure subscription cancellation flow
- [ ] Add payment history page for users
- [ ] Set up monitoring/alerts for failed payments
- [ ] Test subscription renewal flow
- [ ] Test trial period expiration
- [ ] Add customer support contact for payment issues
- [ ] Review Stripe dashboard for compliance requirements
- [ ] Set up automated dunning emails for failed payments

---

## 12. Additional Features (Optional)

### Subscription Management
- Allow users to upgrade/downgrade plans
- Pause subscriptions
- Gift subscriptions

### Payment Methods
- Save payment methods for faster checkout
- Multiple payment methods
- Automatic retry for failed payments

### Analytics
- Revenue tracking
- Churn analysis
- Conversion tracking

---

## Quick Start Summary

1. **Sign up for Stripe** → Get API keys
2. **Add database models** → Run migration
3. **Install Stripe SDK** → `npm install stripe`
4. **Create API routes** → Checkout, webhooks, portal
5. **Update pricing page** → Add checkout button
6. **Test in Stripe test mode** → Use test cards
7. **Deploy and configure webhooks** → Update Stripe dashboard
8. **Switch to live mode** → When ready for production

---

## Resources

- [Stripe Next.js Guide](https://stripe.com/docs/payments/quickstart)
- [Stripe Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)

---

*Last Updated: January 2025*
*Payment Processor: Stripe*
