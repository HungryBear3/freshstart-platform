# Stripe Configuration Complete! ✅

## What's Configured

- ✅ Stripe API keys added
- ✅ Price ID added: `price_...` (store in `.env.local` only; never commit)
- ✅ Product created in Stripe Dashboard
- ✅ Subscribe button ready on pricing page

## Next Steps to Test

### 1. Run Database Migration

The database needs new tables for subscriptions:

```bash
cd newstart-il
npx prisma migrate dev --name add-stripe-subscriptions
```

### 2. Restart Dev Server

Restart your dev server to load the new environment variables:

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

### 3. Test the Checkout Flow

1. **Go to pricing page**: http://localhost:3000/pricing
2. **Click "Start Free Trial"** button
3. **Use Stripe test card**:
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)
4. **Complete checkout** - You'll be redirected to Stripe's checkout page
5. **After payment** - You'll be redirected back to `/dashboard?success=true`

### 4. Verify in Stripe Dashboard

After testing, check your Stripe Dashboard:
- **Payments**: Should show the test payment
- **Customers**: Should show the test customer
- **Subscriptions**: Should show the test subscription with 7-day trial

## Optional: Set Up Webhooks (For Full Testing)

Webhooks allow Stripe to automatically update your database when payments happen.

### For Local Testing:

1. **Install Stripe CLI** (if not already):
   ```bash
   scoop install stripe
   ```

2. **Login**:
   ```bash
   stripe login
   ```

3. **Forward webhooks**:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. **Copy webhook secret** (starts with `whsec_...`)
   - Add to `.env.local`: `STRIPE_WEBHOOK_SECRET=whsec_...`
   - Restart dev server

**Note**: You can test checkout without webhooks, but subscriptions won't update automatically in your database. Webhooks are recommended for full testing.

## Test Cards

| Card Number | Scenario |
|------------|----------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0000 0000 0002` | ❌ Card declined |
| `4000 0025 0000 3155` | 🔐 Requires authentication |
| `4000 0000 0000 9995` | 💰 Insufficient funds |

## Current Environment Variables

Your `.env.local` should have:

```env
# Stripe Configuration (placeholders only — use real values in .env.local; never commit)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
ANNUAL_PRICE_ID=price_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_WEBHOOK_SECRET=whsec_...  # Optional for now
```

## Troubleshooting

### "STRIPE_SECRET_KEY is not set"
- Make sure `.env.local` exists and has the keys
- Restart your dev server after adding env vars

### Checkout not redirecting
- Check browser console for errors
- Verify all environment variables are set
- Make sure you're using test keys (not live keys)

### "Price ID not configured"
- Verify `ANNUAL_PRICE_ID` is in `.env.local`
- Restart dev server after adding it

## After Testing Works

Once checkout is working:
1. ✅ We'll create the subscription management page
2. ✅ Add subscription status checks
3. ✅ Test full subscription lifecycle

---

**Ready to test?** Run the migration and restart your server!
