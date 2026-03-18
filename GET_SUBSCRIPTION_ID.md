# How to Get Your Subscription ID from Stripe

## Quick Steps

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test)
2. Click **Subscriptions** in the left sidebar
3. Find your subscription (should show status "trialing" or "active")
4. Click on the subscription to open it
5. At the top of the page, you'll see:
   - **Subscription ID**: `sub_1AbC123...` ← This is what you need!

## Alternative: Get from Customer Page

1. Go to **Customers** in Stripe Dashboard
2. Find your customer (by email)
3. Click on the customer
4. Scroll to **Subscriptions** section
5. Click on the subscription
6. The Subscription ID is at the top (starts with `sub_`)

## Important Notes

- ❌ Session IDs start with `si_` (this is NOT what you need)
- ✅ Subscription IDs start with `sub_` (this IS what you need)
- ✅ Subscription IDs look like: `sub_1SqGAtK62aWqEJbuafQWM2kM`

## Then Use It

Once you have the subscription ID starting with `sub_`, use it in the sync command:

```javascript
fetch('/api/stripe/sync-subscription', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ subscriptionId: 'sub_YOUR_ACTUAL_ID_HERE' })
}).then(r => r.json()).then(console.log)
```
