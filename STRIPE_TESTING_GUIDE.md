# Stripe Checkout & Trial Testing Guide

## Overview
This guide walks you through testing the complete Stripe checkout flow, including:
- Starting a free trial
- Completing checkout with test cards
- Verifying webhook events
- Checking subscription status

## Prerequisites
- You're logged into your FreshStart IL account
- Stripe is in **Test Mode** (for safe testing)
- Webhook endpoint is configured (or use Stripe CLI for local testing)

---

## Step 1: Start the Checkout Flow

### Option A: From Pricing Page
1. Navigate to `/pricing` on your site
2. You'll see the annual plan card
3. Click the **"Start Free Trial"** button

### Option B: From Dashboard (if not subscribed)
1. Navigate to `/dashboard`
2. If you don't have an active subscription, you'll see a CTA to start trial
3. Click **"Start Free Trial"**

### What Should Happen
- ✅ Button shows "Loading..." briefly
- ✅ You're redirected to Stripe Checkout page
- ✅ You see the annual subscription details
- ✅ It shows "7-day free trial" information

### Check Browser Console
Open DevTools (F12) → Console tab, you should see:
- No errors
- Any `[Checkout]` log messages (if visible)

---

## Step 2: Complete Checkout with Test Card

### Stripe Test Cards

**Success Card** (most common):
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/25)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

**Other Test Cards**:
- `4000 0025 0000 3155` - Requires 3D Secure authentication
- `4000 0000 0000 9995` - Declined card
- `4000 0027 6000 3184` - Insufficient funds

### Complete Checkout
1. On Stripe Checkout page:
   - Enter test card: `4242 4242 4242 4242`
   - Enter expiry: `12/25` (or any future date)
   - Enter CVC: `123`
   - Enter ZIP: `12345`
   - Click **"Subscribe"**

### What Should Happen
- ✅ Stripe processes the payment (in test mode)
- ✅ You're redirected back to `/dashboard?success=true`
- ✅ You see a success message (if implemented)

---

## Step 3: Verify in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test)
2. Check **Events** tab:
   - Look for `checkout.session.completed` event
   - Look for `customer.subscription.created` event
   - Both should show status: "Succeeded"

3. Check **Customers** tab:
   - Find your customer (by email)
   - Should show subscription with status: `trialing` or `active`

4. Check **Subscriptions** tab:
   - Find your subscription
   - Status should be: `trialing` (during 7-day trial)
   - Trial end date should be 7 days from now

---

## Step 4: Verify Database Records

Check that subscription was saved to your database:

### Using Prisma Studio (Local)
```bash
cd newstart-il
npm run db:studio
```
- Navigate to `Subscription` table
- Find record with your `userId`
- Verify fields:
  - `status`: `"trialing"` or `"active"`
  - `stripeSubscriptionId`: Should have a value starting with `sub_`
  - `stripeCustomerId`: Should have a value starting with `cus_`
  - `trialStart`: Should have today's date
  - `trialEnd`: Should be 7 days from now

### Using Database Query (Production)
If you have database access, query:
```sql
SELECT * FROM subscriptions WHERE "userId" = 'YOUR_USER_ID';
```

---

## Step 5: Verify Webhook Events (Production)

### If Webhooks Are Configured
1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Find your webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Check recent events:
   - `checkout.session.completed` - Should be successful
   - `customer.subscription.created` - Should be successful
   - `customer.subscription.updated` - May appear

### Check Vercel Logs
1. Go to Vercel Dashboard → Your Project → Deployments
2. Click latest deployment → **Runtime Logs**
3. Look for webhook logs:
   - `[Webhook] checkout.session.completed`
   - `[Webhook] subscription created/updated`
   - Should not show errors

---

## Step 6: Test Subscription Status in App

### Check Dashboard
1. Go to `/dashboard`
2. Verify you can access premium features:
   - Case management
   - Document generation
   - Financial calculators
   - All features should be unlocked

### Check Profile/Account Page
1. Go to `/dashboard/profile` (or account settings)
2. Verify subscription status is displayed:
   - Shows "Active" or "Trial"
   - Shows trial end date
   - May show subscription details

---

## Step 7: Test Trial Period (Optional)

If you want to test trial expiration behavior:

### Option A: Wait for Trial End (7 days)
- Simply wait 7 days
- After trial ends, Stripe should charge the card
- Status changes from `trialing` to `active`

### Option B: Use Stripe CLI (Advanced)
1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Forward webhooks locally:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
3. Trigger test events:
   ```bash
   stripe trigger checkout.session.completed
   stripe trigger customer.subscription.trial_will_end
   ```

---

## Troubleshooting

### Issue: "Price ID not configured"
**Solution**: Check `ANNUAL_PRICE_ID` is set in Vercel environment variables and redeploy

### Issue: "Unauthorized" error
**Solution**: Make sure you're logged in before clicking "Start Free Trial"

### Issue: Webhook not receiving events
**Solution**: 
- Verify `STRIPE_WEBHOOK_SECRET` is set in Vercel
- Check webhook endpoint URL in Stripe Dashboard matches your production URL
- Test with Stripe CLI first

### Issue: Subscription not appearing in database
**Solution**:
- Check Vercel logs for webhook errors
- Verify database connection is working
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard

### Issue: Still seeing "Start Trial" after subscribing
**Solution**:
- Clear browser cache
- Check subscription status in database
- Verify webhook successfully created subscription record

---

## Test Scenarios Checklist

- [ ] **Happy Path**: Start trial → Complete checkout → Redirect to dashboard → Subscription active
- [ ] **Cancel Checkout**: Start checkout → Click cancel → Redirect to pricing → No subscription created
- [ ] **Unauthenticated**: Log out → Try to start trial → Should redirect to sign in
- [ ] **Webhook Processing**: Complete checkout → Verify webhook events in Stripe → Check database record created
- [ ] **Subscription Status**: After subscribing → Check dashboard shows premium features → Profile shows subscription
- [ ] **Trial Period**: After trial ends → Subscription continues → Payment charged (if using real card in production)

---

## Next Steps

After successful testing:
1. ✅ Verify all test scenarios work
2. ✅ Test with different Stripe test cards
3. ✅ Verify webhook events are processed correctly
4. ✅ Check subscription management features (cancel, update)
5. ✅ Test payment failure scenarios (optional)
6. ✅ Switch to **Production Mode** in Stripe when ready for real customers

---

## Production Checklist

Before going live:
- [ ] Switch Stripe to **Production Mode**
- [ ] Update `STRIPE_SECRET_KEY` to production key in Vercel
- [ ] Update `ANNUAL_PRICE_ID` to production price ID
- [ ] Configure production webhook endpoint in Stripe
- [ ] Set `STRIPE_WEBHOOK_SECRET` to production webhook secret
- [ ] Test end-to-end with real card (your own, then refund)
- [ ] Set up monitoring/alerts for failed payments
- [ ] Configure email notifications for subscription events

---

## Resources

- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Vercel Logs Documentation](https://vercel.com/docs/monitoring/logs)