# Stripe Quick Start - Step-by-Step Configuration

Follow these steps to configure Stripe for FreshStart IL.

## ✅ Why Prebuilt Checkout?

**Prebuilt Checkout (Stripe Checkout)** is the right choice because:
- ✅ Already implemented in the code
- ✅ More secure (PCI compliant)
- ✅ Better mobile experience
- ✅ Handles trials automatically
- ✅ Simpler to maintain
- ✅ Recommended by Stripe for subscriptions

## Step 1: Create/Login to Stripe Account

1. Go to https://dashboard.stripe.com
2. Sign in or create a new account
3. **Important**: Start in **Test mode** (toggle in top right)

## Step 2: Get Your API Keys

1. In Stripe Dashboard, click **"Developers"** (left sidebar)
2. Click **"API keys"**
3. Under **"Test mode"**, you'll see:
   - **Publishable key** (starts with `pk_test_...`) - Copy this
   - **Secret key** (starts with `sk_test_...`) - Click "Reveal test key" and copy

**📋 Copy both keys - you'll need them in Step 4**

## Step 3: Create Product and Price

1. In Stripe Dashboard, click **"Products"** (left sidebar)
2. Click **"+ Add product"** button
3. Fill in the form:
   - **Name**: `FreshStart IL Annual Subscription`
   - **Description**: `Annual subscription to FreshStart IL divorce guidance platform. Includes full access to all tools and features for one year, with the flexibility to renew if your divorce process extends beyond the initial year. Perfect for managing your entire divorce journey, including ongoing child custody arrangements, parenting plan updates, and case management needs.`
   - **Pricing model**: Select **"Recurring"**
   - **Price**: `299.00`
   - **Billing period**: Select **"Yearly"**
   - **Currency**: `USD` (should be default)
4. Click **"Save product"**
5. **Copy the Price ID** - It starts with `price_...` (you'll see it after saving)

**📋 Copy the Price ID - you'll need it in Step 4**

### Optional: Add 7-Day Trial

1. Click on the price you just created
2. Scroll to **"Trial period"**
3. Set to `7 days`
4. Save changes

## Step 4: Add Environment Variables

### For Local Development

1. Open your `.env.local` file in the `newstart-il` folder
2. Add these lines (replace with your actual values):

```env
# Stripe Keys (Test Mode)
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE

# Stripe Price ID
ANNUAL_PRICE_ID=price_YOUR_PRICE_ID_HERE

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Example:**
```env
STRIPE_SECRET_KEY=sk_test_51AbC123...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51XyZ789...
ANNUAL_PRICE_ID=price_1AbCdEf123...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### For Production (Vercel)

1. Go to your Vercel project dashboard
2. Click **"Settings"** → **"Environment Variables"**
3. Add each variable (use **live** keys when ready):
   - `STRIPE_SECRET_KEY` = `sk_live_...` (for production)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_...` (for production)
   - `ANNUAL_PRICE_ID` = Your production price ID
   - `NEXT_PUBLIC_APP_URL` = `https://www.freshstart-il.com`
   - `STRIPE_WEBHOOK_SECRET` = (You'll get this in Step 5)

## Step 5: Set Up Webhooks (For Local Testing)

Webhooks let Stripe notify your app about payments. For local testing:

### Option A: Use Stripe CLI (Recommended for Development)

1. **Install Stripe CLI**:
   ```bash
   # Windows (using Scoop)
   scoop install stripe
   
   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe**:
   ```bash
   stripe login
   ```
   (This will open a browser to authorize)

3. **Forward webhooks to your local server**:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. **Copy the webhook signing secret** (starts with `whsec_...`)
   - Add to `.env.local` as: `STRIPE_WEBHOOK_SECRET=whsec_...`

### Option B: Skip Webhooks for Now (Testing Only)

You can test checkout without webhooks, but subscriptions won't update automatically. For full testing, use Option A.

## Step 6: Run Database Migration

The database needs new tables for subscriptions. Run:

```bash
cd newstart-il
npx prisma migrate dev --name add-stripe-subscriptions
```

This will:
- Create `subscriptions` table
- Create `payments` table
- Update your database schema

## Step 7: Test the Integration

1. **Start your dev server** (if not already running):
   ```bash
   npm run dev
   ```

2. **Start Stripe webhook forwarding** (in another terminal):
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. **Test checkout**:
   - Go to http://localhost:3000/pricing
   - Click "Start Free Trial" (we'll add this button next)
   - Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

4. **Verify in Stripe Dashboard**:
   - Go to **"Payments"** - you should see the test payment
   - Go to **"Customers"** - you should see the test customer
   - Go to **"Subscriptions"** - you should see the test subscription

## Test Cards

Stripe provides test cards for different scenarios:

| Card Number | Scenario |
|------------|----------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 0002` | Card declined |
| `4000 0025 0000 3155` | Requires authentication |
| `4000 0000 0000 9995` | Insufficient funds |

See full list: https://stripe.com/docs/testing

## Checklist

- [ ] Stripe account created/logged in
- [ ] API keys copied (test mode)
- [ ] Product created ($299/year)
- [ ] Price ID copied
- [ ] Environment variables added to `.env.local`
- [ ] Database migration run
- [ ] Stripe CLI installed (for webhooks)
- [ ] Webhook forwarding started
- [ ] Test checkout completed successfully

## Next Steps

Once Stripe is configured:
1. ✅ Add "Subscribe" button to pricing page
2. ✅ Create subscription management page
3. ✅ Test full subscription flow

## Troubleshooting

### "STRIPE_SECRET_KEY is not set"
- Make sure you added it to `.env.local`
- Restart your dev server after adding env vars

### Webhook signature verification failed
- Make sure `STRIPE_WEBHOOK_SECRET` matches the secret from `stripe listen`
- Restart your dev server after adding the webhook secret

### Checkout not working
- Check browser console for errors
- Verify all environment variables are set
- Make sure you're using test keys (not live keys)

## Ready for Production?

When ready to accept real payments:
1. Complete Stripe account verification
2. Switch to live mode in Stripe Dashboard
3. Get live API keys
4. Create live product
5. Update Vercel environment variables with live keys
6. Set up production webhook endpoint

---

**Need help?** Check the full guide: `STRIPE_SETUP_GUIDE.md`
