# Manual Subscription Sync Instructions

If the automatic sync isn't working, you can manually sync by providing the subscription ID directly from Stripe.

## Step 1: Get Subscription ID from Stripe

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test) (or production)
2. Navigate to **Customers** → Find your customer
3. Click on the customer
4. Find the **Subscriptions** section
5. Copy the **Subscription ID** (starts with `sub_`)

OR

1. Go to **Subscriptions** in Stripe Dashboard
2. Find your subscription
3. Copy the **Subscription ID** (starts with `sub_`)

## Step 2: Sync Using Subscription ID

### Option A: Using Browser Console

1. Open your site in browser
2. Open DevTools (F12) → Console
3. Type `allow pasting` and press Enter
4. Run this command (replace `sub_XXXXX` with your actual subscription ID):

```javascript
fetch('/api/stripe/sync-subscription', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ subscriptionId: 'sub_XXXXX' })
}).then(r => r.json()).then(console.log)
```

### Option B: Using GET (after deployment with better error messages)

After the latest deployment, try the sync endpoint again:
1. It will show more detailed error messages
2. Check the error message - it might tell you:
   - What email it's searching for
   - If a customer was found but no subscriptions
   - The customer ID if customer exists

## Step 3: Verify Sync Worked

After syncing, you should see:
```json
{
  "success": true,
  "subscription": {
    "id": "...",
    "status": "trialing",
    "isActive": true,
    ...
  }
}
```

Then:
1. Refresh `/dashboard`
2. The "Complete Your Subscription" banner should be gone
3. You should see "Active Subscription" banner instead
4. Questionnaires and other features should be accessible

## Troubleshooting

### If you get "No Stripe customer found"
- Check that the email in your FreshStart IL account matches the email used in Stripe checkout
- Try syncing with the subscription ID directly (Option A above)

### If you get "No subscription found for this customer"
- The customer exists but subscription lookup failed
- Use the subscription ID method (Option A) to sync directly

### If sync succeeds but dashboard still shows banner
- Clear browser cache
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Check Vercel logs to see if there are any errors
