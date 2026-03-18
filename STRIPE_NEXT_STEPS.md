# Stripe Configuration - Next Steps

## ✅ What's Done

- Stripe API keys added to `.env.local`
- Publishable key: `pk_test_...` (in `.env.local` only; never commit)
- Secret key: `sk_test_...` (in `.env.local` only; never commit)

## 🔒 Security Reminder

✅ Your `.env.local` file is in `.gitignore` - it won't be committed to git
⚠️ **Never share these keys publicly**
⚠️ **Never commit them to git**
⚠️ Use **test keys** for development, **live keys** for production

## 📋 Next Steps

### Step 1: Create Product in Stripe Dashboard

1. Go to https://dashboard.stripe.com/test/products
2. Click **"+ Add product"**
3. Fill in:
   - **Name**: `FreshStart IL Annual Subscription`
   - **Description**: 
     ```
     Annual subscription to FreshStart IL divorce guidance platform. Includes full access to all tools and features for one year, with the flexibility to renew if your divorce process extends beyond the initial year. Perfect for managing your entire divorce journey, including ongoing child custody arrangements, parenting plan updates, and case management needs.
     ```
   - **Pricing model**: Select **"Recurring"**
   - **Price**: `299.00`
   - **Billing period**: Select **"Yearly"**
   - **Currency**: `USD`
4. Click **"Save product"**
5. **Copy the Price ID** (starts with `price_...`)

### Step 2: Add Price ID to .env.local

After you get the Price ID from Stripe, add this line to your `.env.local`:

```env
ANNUAL_PRICE_ID=price_YOUR_PRICE_ID_HERE
```

### Step 3: Run Database Migration

The database needs new tables for subscriptions:

```bash
cd newstart-il
npx prisma migrate dev --name add-stripe-subscriptions
```

### Step 4: Set Up Webhooks (For Local Testing)

1. **Install Stripe CLI** (if not already):
   ```bash
   # Windows (using Scoop)
   scoop install stripe
   ```

2. **Login to Stripe**:
   ```bash
   stripe login
   ```

3. **Forward webhooks to local server**:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. **Copy the webhook signing secret** (starts with `whsec_...`)
   - Add to `.env.local` as: `STRIPE_WEBHOOK_SECRET=whsec_...`

### Step 5: Test the Integration

1. **Start your dev server**:
   ```bash
   npm run dev
   ```

2. **Start Stripe webhook forwarding** (in another terminal):
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. **Test checkout**:
   - Go to http://localhost:3000/pricing
   - Click "Start Free Trial"
   - Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

4. **Verify in Stripe Dashboard**:
   - Go to **"Payments"** - you should see the test payment
   - Go to **"Customers"** - you should see the test customer
   - Go to **"Subscriptions"** - you should see the test subscription

## 🧪 Test Cards

| Card Number | Scenario |
|------------|----------|
| `4242 4242 4242 4242` | ✅ Success |
| `4000 0000 0000 0002` | ❌ Card declined |
| `4000 0025 0000 3155` | 🔐 Requires authentication |
| `4000 0000 0000 9995` | 💰 Insufficient funds |

## 📝 Current .env.local Structure

Your `.env.local` should now have:

```env
# Database
DATABASE_URL=...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...

# Stripe Configuration (placeholders — use real values in .env.local; never commit)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
ANNUAL_PRICE_ID=price_...  # Add this after creating product
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_WEBHOOK_SECRET=whsec_...  # Add this after setting up webhooks
```

## ✅ Checklist

- [x] Stripe API keys added to `.env.local`
- [ ] Product created in Stripe Dashboard
- [ ] Price ID copied and added to `.env.local`
- [ ] Database migration run
- [ ] Stripe CLI installed
- [ ] Webhook forwarding set up
- [ ] Test checkout completed successfully

## 🚀 After Testing

Once everything works locally:
1. Create subscription management page
2. Add subscription status checks to protected routes
3. Test full subscription lifecycle
4. Prepare for production (get live keys, create live product)

---

**Need help?** Check `STRIPE_QUICK_START.md` for detailed instructions.
