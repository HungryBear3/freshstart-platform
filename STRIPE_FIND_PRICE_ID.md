# How to Find Your Stripe Price ID

## You Have the Product ID ✅
- Product ID: `prod_TnruoU3ITlRXLE`

## But We Need the Price ID ⚠️

For subscriptions, Stripe needs the **Price ID** (starts with `price_...`), not the Product ID.

## How to Get the Price ID

### Option 1: From Stripe Dashboard

1. Go to https://dashboard.stripe.com/test/products
2. Click on your product: **"FreshStart IL Annual Subscription"**
3. You'll see a section called **"Pricing"**
4. Under the price you created ($299/year), you'll see:
   - **Price ID**: `price_...` ← **Copy this!**
   - It will look something like: `price_1AbCdEf123...`

### Option 2: From Products List

1. Go to https://dashboard.stripe.com/test/products
2. Find your product in the list
3. Click on it
4. Scroll down to see the pricing section
5. The Price ID is displayed next to the price

### Option 3: From API (if you have Stripe CLI)

```bash
stripe prices list --product=prod_TnruoU3ITlRXLE
```

## What the Price ID Looks Like

- ✅ Correct: `price_1AbCdEf123GhIjKl456MnOpQr`
- ❌ Wrong: `prod_TnruoU3ITlRXLE` (this is the product ID)

## Once You Have the Price ID

Add it to your `.env.local`:

```env
ANNUAL_PRICE_ID=price_YOUR_PRICE_ID_HERE
```

Then restart your dev server and test!
