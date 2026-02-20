# Stripe Setup Guide for FreshStart IL

This guide will walk you through connecting your Stripe account to FreshStart IL.

## Prerequisites

- ✅ Stripe account created (business or personal)
- ✅ Business bank account (if using business Stripe account)
- ✅ Domain configured (freshstart-il.com)

## Step 1: Get Your Stripe API Keys

1. **Log in to Stripe Dashboard**
   - Go to https://dashboard.stripe.com
   - Sign in or create an account

2. **Get Test API Keys** (for development)
   - Click "Developers" in the left sidebar
   - Click "API keys"
   - Under "Test mode", you'll see:
     - **Publishable key** (starts with `pk_test_...`)
     - **Secret key** (starts with `sk_test_...`) - Click "Reveal test key"

3. **Copy both keys** - You'll need them in Step 3

## Step 2: Create Product and Price in Stripe

1. **Go to Products**
   - In Stripe Dashboard, click "Products" in the left sidebar
   - Click "+ Add product"

2. **Create Annual Subscription Product**
   - **Name**: `FreshStart IL Annual Subscription`
   - **Description**: `Annual subscription to FreshStart IL divorce guidance platform`
   - **Pricing model**: Select "Recurring"
   - **Price**: `$299.00`
   - **Billing period**: `Yearly`
   - **Currency**: `USD`
   - Click "Save product"

3. **Copy the Price ID**
   - After creating, you'll see a Price ID (starts with `price_...`)
   - **Copy this ID** - You'll need it in Step 3

4. **Enable 7-Day Trial** (Optional but recommended)
   - Click on the price you just created
   - Under "Trial period", set to `7 days`
   - Save changes

## Step 3: Add Environment Variables

### Local Development (`.env.local`)

Add these to your `.env.local` file:

```env
# Stripe Keys (Test Mode)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Price IDs
ANNUAL_PRICE_ID=price_...

# App URL (for redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Production (Vercel Dashboard)

1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add each variable:
   - `STRIPE_SECRET_KEY` = Your **live** secret key (starts with `sk_live_...`)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = Your **live** publishable key (starts with `pk_live_...`)
   - `ANNUAL_PRICE_ID` = Your production price ID
   - `NEXT_PUBLIC_APP_URL` = `https://www.freshstart-il.com`
   - `STRIPE_WEBHOOK_SECRET` = (You'll get this in Step 4)

## Step 4: Set Up Webhooks

Webhooks allow Stripe to notify your app about payment events.

### For Local Development (Testing)

1. **Install Stripe CLI** (if not already installed)
   ```bash
   # Windows (using Scoop)
   scoop install stripe
   
   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe CLI**
   ```bash
   stripe login
   ```

3. **Forward webhooks to local server**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   
   This will output a webhook signing secret (starts with `whsec_...`)
   - Add this to `.env.local` as `STRIPE_WEBHOOK_SECRET`

### For Production

1. **Go to Stripe Dashboard** → "Developers" → "Webhooks"
2. **Click "Add endpoint"**
3. **Endpoint URL**: `https://www.freshstart-il.com/api/webhooks/stripe`
4. **Select events to listen to**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. **Click "Add endpoint"**
6. **Copy the webhook signing secret** (starts with `whsec_...`)
   - Add this to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

## Step 5: Run Database Migration

The database schema has been updated to include Subscription and Payment models. Run the migration:

```bash
cd newstart-il
npx prisma migrate dev --name add-stripe-subscriptions
```

Or for production:
```bash
npx prisma migrate deploy
```

## Step 6: Test the Integration

### Test Locally

1. **Start your dev server**
   ```bash
   npm run dev
   ```

2. **Start Stripe webhook forwarding** (in another terminal)
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. **Test checkout flow**
   - Go to http://localhost:3000/pricing
   - Click "Start Free Trial" or "Subscribe"
   - Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date (e.g., 12/34)
   - Any 3-digit CVC (e.g., 123)
   - Any ZIP code (e.g., 12345)

4. **Verify in Stripe Dashboard**
   - Go to "Payments" - you should see the test payment
   - Go to "Customers" - you should see the test customer
   - Go to "Subscriptions" - you should see the test subscription

### Test Cards

Stripe provides test cards for different scenarios:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires authentication**: `4000 0025 0000 3155`
- **Insufficient funds**: `4000 0000 0000 9995`

See full list: https://stripe.com/docs/testing

## Step 7: Switch to Live Mode (Production)

When ready to accept real payments:

1. **Complete Stripe account verification**
   - Go to Stripe Dashboard → "Settings" → "Account"
   - Complete business verification (if using business account)
   - Add bank account for payouts

2. **Get Live API Keys**
   - Toggle "Test mode" to "Live mode" in Stripe Dashboard
   - Copy live keys (starts with `sk_live_...` and `pk_live_...`)

3. **Create Live Product**
   - Create the same product in live mode
   - Copy the live price ID

4. **Update Vercel Environment Variables**
   - Replace test keys with live keys
   - Update price ID to live price ID
   - Update webhook secret (create new webhook endpoint in live mode)

5. **Test with real card** (small amount first!)
   - Use your own card to test
   - Verify payment appears in Stripe Dashboard
   - Verify subscription is created in your database

## Troubleshooting

### "STRIPE_SECRET_KEY is not set"
- Make sure you've added `STRIPE_SECRET_KEY` to `.env.local` (local) or Vercel (production)

### Webhook signature verification failed
- Make sure `STRIPE_WEBHOOK_SECRET` matches the webhook endpoint secret
- For local testing, use the secret from `stripe listen` command
- For production, use the secret from Stripe Dashboard webhook endpoint

### Checkout session not redirecting
- Verify `NEXT_PUBLIC_APP_URL` is set correctly
- Check browser console for errors
- Verify `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set

### Subscription not appearing in database
- Check webhook logs in Stripe Dashboard
- Verify webhook endpoint is receiving events
- Check server logs for errors

## Next Steps

After Stripe is connected:

1. ✅ Add "Subscribe" button to pricing page
2. ✅ Create subscription management page in dashboard
3. ✅ Add subscription status checks to protected routes
4. ✅ Test full subscription lifecycle (signup → payment → renewal → cancellation)

## Support

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe Support**: https://support.stripe.com
- **Stripe Testing Guide**: https://stripe.com/docs/testing
