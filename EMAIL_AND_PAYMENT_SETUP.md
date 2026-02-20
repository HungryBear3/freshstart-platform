# Email and Payment Setup Guide

This guide covers setting up email through GoDaddy and payment processing for NewStart IL.

---

## Part 1: Email Setup with GoDaddy

### Step 1: Set Up GoDaddy Email

**If your GoDaddy package includes email:**

1. **Log in to GoDaddy**
   - Go to https://www.godaddy.com
   - Sign in to your account
   - Navigate to **My Products** → **Email**

2. **Create Email Accounts**
   - Create the following email accounts:
     - `support@freshstart-il.com` (or `support@yourdomain.com`)
     - `noreply@freshstart-il.com` (for automated emails)
     - `contact@freshstart-il.com` (optional, for general inquiries)

3. **Set Up Email Forwarding (Optional)**
   - You can set up forwarding to your personal email
   - Or access emails directly through GoDaddy's webmail

### Step 2: Get GoDaddy SMTP Settings

**GoDaddy SMTP Configuration:**
```
SMTP Host: smtpout.secureserver.net
SMTP Port: 465 (SSL) or 587 (TLS)
SMTP User: support@freshstart-il.com
SMTP Password: [Your email account password]
SMTP From: support@freshstart-il.com
```

### Step 3: Configure Environment Variables

**For Local Development (.env.local):**
```env
SMTP_HOST=smtpout.secureserver.net
SMTP_PORT=587
SMTP_USER=support@freshstart-il.com
SMTP_PASSWORD=your-email-password-here
SMTP_FROM=support@freshstart-il.com
```

**For Production (Vercel Dashboard):**
1. Go to Vercel → Your Project → Settings → Environment Variables
2. Add the following variables (set for Production):
   - `SMTP_HOST` = `smtpout.secureserver.net`
   - `SMTP_PORT` = `587`
   - `SMTP_USER` = `support@freshstart-il.com`
   - `SMTP_PASSWORD` = `[Your email password]`
   - `SMTP_FROM` = `support@freshstart-il.com`

3. **Important:** After adding variables, redeploy your project

### Step 4: Test Email Configuration

1. **Test Locally:**
   ```bash
   # Use the password reset feature to test email sending
   # Or create a test script
   ```

2. **Check Email Logs:**
   - GoDaddy email logs (if available)
   - Vercel function logs
   - Check spam folder

### Step 5: Set Up Email Forwarding (Recommended)

**Why Forwarding:**
- Check emails from your personal email
- Use email clients like Gmail, Outlook
- Better spam filtering

**How to Set Up Forwarding:**
1. In GoDaddy email settings, find "Forwarding" or "Email Forwarding"
2. Set up forwarding from `support@freshstart-il.com` → `your-personal@email.com`
3. Keep a copy in GoDaddy mailbox (optional)

---

## Part 2: Alternative Email Services (Recommended for Production)

**Why Use a Third-Party Service:**
- Better deliverability (emails less likely to go to spam)
- Email analytics and tracking
- More reliable delivery
- Better for transactional emails

### Option A: SendGrid (Recommended)

**Setup:**
1. Sign up at https://sendgrid.com
2. Verify your domain (GoDaddy DNS)
3. Create API key
4. Update environment variables:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM=support@freshstart-il.com
```

**Benefits:**
- Free tier: 100 emails/day forever
- Excellent deliverability
- Email analytics
- Easy to set up

### Option B: Mailgun

**Setup:**
1. Sign up at https://mailgun.com
2. Verify domain
3. Get SMTP credentials
4. Update environment variables

**Benefits:**
- Free tier: 5,000 emails/month (first 3 months), then 100/day
- Good deliverability
- API access

### Option C: AWS SES (Most Affordable)

**Setup:**
1. Sign up for AWS
2. Set up SES in your region
3. Verify domain
4. Get SMTP credentials
5. Update environment variables

**Benefits:**
- Very affordable ($0.10 per 1,000 emails)
- High deliverability
- Scales well

---

## Part 3: Payment Processing Setup

### When to Set Up Payments

**Recommended Timeline:**
- **Now:** Set up infrastructure (database models, API routes)
- **Before Beta Launch:** Implement basic payment processing
- **For Full Launch:** Complete payment features

**Or:** Start with free service and add payments later

### Step 1: Choose Payment Processor

**Recommended: Stripe**

**Why Stripe:**
- ✅ Excellent Next.js integration
- ✅ Handles PCI compliance automatically
- ✅ Supports subscriptions, one-time payments, trials
- ✅ Great developer experience
- ✅ Built-in webhook system
- ✅ Test mode for development

**Pricing:**
- 2.9% + $0.30 per successful card charge
- No monthly fees
- Free for test mode

**Alternatives:**
- PayPal (good for international, more complex)
- Paddle (good for SaaS, handles tax automatically)

### Step 2: Set Up Stripe Account

1. **Create Stripe Account**
   - Go to https://stripe.com
   - Sign up for account
   - Complete business information

2. **Get API Keys**
   - Dashboard → Developers → API Keys
   - Get **Publishable Key** (public) and **Secret Key** (private)
   - Keep Secret Key secure!

3. **Test Mode**
   - Use test keys for development
   - Use test card numbers: `4242 4242 4242 4242`
   - Switch to live keys for production

### Step 3: Install Stripe

```bash
cd newstart-il
npm install @stripe/stripe-js stripe
```

### Step 4: Add Stripe to Environment Variables

**Local Development (.env.local):**
```env
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # For webhooks (add later)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # For client-side
```

**Production (Vercel):**
1. Add all Stripe keys to Vercel environment variables
2. Use **live keys** (not test keys) for production
3. Set for Production environment

### Step 5: Database Models for Payments

**Add to `prisma/schema.prisma`:**

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
  plan              String   // "free", "basic", "premium"
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

**Then run migration:**
```bash
npx prisma migrate dev --name add-subscriptions
npx prisma generate
```

### Step 6: Create Stripe API Routes

**Required Routes:**
1. `/api/payments/create-checkout` - Create payment session
2. `/api/payments/webhook` - Handle Stripe webhooks
3. `/api/payments/success` - Success page handler
4. `/api/payments/cancel` - Cancel page handler

**See:** `PAYMENT_IMPLEMENTATION_GUIDE.md` for detailed implementation

### Step 7: Create Payment UI

**Components Needed:**
1. Pricing page (already exists at `/pricing`)
2. Checkout button component
3. Payment form (handled by Stripe)
4. Subscription management page

---

## Recommended Setup Timeline

### Phase 1: Email Setup (Do Now)
1. ✅ Set up GoDaddy email accounts
2. ✅ Configure SMTP in Vercel environment variables
3. ✅ Test email sending (password reset, verification)
4. ⚠️ Consider upgrading to SendGrid for better deliverability (before launch)

### Phase 2: Payment Infrastructure (Before Launch)
1. Set up Stripe account
2. Add database models for subscriptions/payments
3. Create basic payment API routes
4. Test payment flow in test mode

### Phase 3: Payment Integration (For Paid Features)
1. Create checkout flow
2. Set up webhooks
3. Implement subscription management
4. Test end-to-end payment flow
5. Switch to live mode when ready

---

## Quick Start: Email Setup

**For immediate email functionality:**

1. **Set up GoDaddy Email** (5 minutes)
   - Create `support@freshstart-il.com` in GoDaddy
   - Get password

2. **Add to Vercel** (2 minutes)
   - Go to Vercel → Settings → Environment Variables
   - Add:
     ```
     SMTP_HOST=smtpout.secureserver.net
     SMTP_PORT=587
     SMTP_USER=support@freshstart-il.com
     SMTP_PASSWORD=[your password]
     SMTP_FROM=support@freshstart-il.com
     ```
   - Redeploy

3. **Test** (2 minutes)
   - Use "Forgot Password" feature
   - Check email (and spam folder)

**Total time: ~10 minutes**

---

## Quick Start: Payment Setup (When Ready)

**When you're ready to collect payments:**

1. **Set up Stripe** (15 minutes)
   - Create account
   - Get API keys
   - Add to environment variables

2. **Add Database Models** (10 minutes)
   - Add Subscription and Payment models
   - Run migration

3. **Create Basic Checkout** (1-2 hours)
   - Create checkout API route
   - Add checkout button to pricing page
   - Test with test cards

**Total time: ~2-3 hours**

---

## Cost Considerations

### Email Costs

**GoDaddy Email (if included):**
- Usually included with hosting package
- Free if already paid for
- Limited features and deliverability

**SendGrid:**
- Free: 100 emails/day forever
- Paid: $19.95/month for 50,000 emails

**Mailgun:**
- Free: 5,000 emails/month (first 3 months), then 100/day
- Paid: $35/month for 50,000 emails

**AWS SES:**
- Very affordable: $0.10 per 1,000 emails
- No free tier, but very cheap

### Payment Processing Costs

**Stripe:**
- 2.9% + $0.30 per successful transaction
- No monthly fees
- No setup fees

**Example:**
- $100 payment = $2.90 + $0.30 = $3.20 fee
- You receive: $96.80

---

## Recommendations

### For Email (Now):
1. **Immediate:** Set up GoDaddy email for contact/support
2. **Before Launch:** Upgrade to SendGrid for better deliverability
3. **Reason:** GoDaddy email may have deliverability issues, SendGrid is more reliable

### For Payments (Later):
1. **For Beta:** Not needed if service is free
2. **Before Public Launch:** Set up Stripe if you want to charge
3. **Timeline:** Can add payments anytime, doesn't block market testing

---

## Current Status

### Email Setup
- ✅ Email service configured (nodemailer)
- ✅ SMTP settings ready in code
- ⚠️ Need to configure GoDaddy email or SendGrid
- ⚠️ Need to add environment variables to Vercel

### Payment Setup
- ✅ Payment implementation guide exists
- ⚠️ Database models not yet added (can add when ready)
- ⚠️ Stripe not installed yet (can install when ready)
- ⚠️ Payment API routes not created (can create when ready)

**Recommendation:** Set up email now, add payments when you're ready to monetize.

---

## Next Steps

### This Week (Email):
1. Set up GoDaddy email accounts
2. Configure SMTP in Vercel
3. Test email sending
4. (Optional) Set up SendGrid for better deliverability

### Later (Payments):
1. Create Stripe account when ready
2. Add subscription/payment models to database
3. Install Stripe packages
4. Implement checkout flow
5. Test thoroughly before accepting real payments

---

*Last Updated: January 2025*
