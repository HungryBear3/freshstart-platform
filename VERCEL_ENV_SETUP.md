# Vercel Environment Variables Setup Guide

This guide walks you through setting up all required environment variables in your Vercel project for analytics and marketing tracking.

## Step 1: Access Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your **FreshStart IL** project
3. Navigate to **Settings** → **Environment Variables**

## Step 2: Add Analytics Environment Variables

Add the following environment variables one by one:

### Google Analytics 4 (GA4)

1. **Variable Name:** `NEXT_PUBLIC_GA_MEASUREMENT_ID`
2. **Value:** Your GA4 Measurement ID (format: `G-XXXXXXXXXX`)
3. **How to get it:**
   - Go to [Google Analytics](https://analytics.google.com/)
   - Select your property (or create one)
   - Go to **Admin** (gear icon) → **Data Streams**
   - Click on your web stream
   - Copy the **Measurement ID** (starts with `G-`)

4. **Environment:** Select all (Production, Preview, Development)

### Google Ads Conversion Tracking

1. **Variable Name:** `NEXT_PUBLIC_GOOGLE_ADS_ID`
2. **Value:** Your Google Ads conversion ID (format: `AW-XXXXXXXXX`)
3. **How to get it:**
   - Go to [Google Ads](https://ads.google.com/)
   - Click **Tools & Settings** → **Conversions**
   - Create a new conversion action (or use existing)
   - Select **Website** as the source
   - Copy the **Conversion ID** (starts with `AW-`)

4. **Environment:** Select all (Production, Preview, Development)

5. **Variable Name:** `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL`
6. **Value:** Your conversion label (format: `XXXXXXX`)
7. **How to get it:**
   - In the same conversion action page
   - Copy the **Conversion Label** (usually a short string like `abc123`)

8. **Environment:** Select all (Production, Preview, Development)

### Meta (Facebook) Pixel

1. **Variable Name:** `NEXT_PUBLIC_META_PIXEL_ID`
2. **Value:** Your Meta Pixel ID (format: `XXXXXXXXXXXXXXX` - 15 digits)
3. **How to get it:**
   - Go to [Meta Events Manager](https://business.facebook.com/events_manager2)
   - Select your Pixel (or create one)
   - Go to **Settings**
   - Copy the **Pixel ID** (15-digit number)

4. **Environment:** Select all (Production, Preview, Development)

## Step 3: Verify Environment Variables

After adding all variables:

1. **Redeploy your application:**
   - Go to **Deployments** tab
   - Click the **⋯** menu on the latest deployment
   - Select **Redeploy**
   - Or push a new commit to trigger a new deployment

2. **Verify in production:**
   - Visit your live site
   - Open browser DevTools → **Network** tab
   - Filter by `gtag` or `facebook`
   - You should see requests to Google Analytics and Meta Pixel

## Step 4: Test Analytics Tracking

### Test Google Analytics

1. Visit your live site
2. Open [Google Analytics Realtime](https://analytics.google.com/analytics/web/#/realtime)
3. You should see your visit appear within 30 seconds

### Test Google Ads Conversion

1. Complete a test purchase (use test card `4242 4242 4242 4242`)
2. In Google Ads, go to **Tools & Settings** → **Conversions**
3. Check your conversion action - it may take a few hours to show up

### Test Meta Pixel

1. Install [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc) Chrome extension
2. Visit your live site
3. The extension should show your Pixel ID and events firing

## Troubleshooting

### Variables not working?

- **Check variable names:** Must match exactly (case-sensitive)
- **Redeploy:** Environment variables require a new deployment
- **Check browser console:** Look for errors related to analytics
- **Verify IDs:** Make sure you copied the full ID without extra spaces

### Analytics not tracking?

- **Ad blockers:** Disable ad blockers to test
- **Privacy settings:** Some browsers block tracking by default
- **Network tab:** Check if requests are being made to analytics services
- **Console errors:** Check browser console for JavaScript errors

## Environment Variable Summary

| Variable Name | Format | Required | Source |
|---------------|--------|----------|--------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-XXXXXXXXXX` | Yes | Google Analytics |
| `NEXT_PUBLIC_GOOGLE_ADS_ID` | `AW-XXXXXXXXX` | Yes | Google Ads |
| `NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL` | `XXXXXXX` | Yes | Google Ads |
| `NEXT_PUBLIC_META_PIXEL_ID` | `XXXXXXXXXXXXXXX` | Optional | Meta Events Manager |

## Next Steps

After setting up environment variables:

1. ✅ Test complete user flow (see `TESTING_CHECKLIST.md`)
2. ✅ Create marketing links (see `/admin/marketing-links`)
3. ✅ Verify analytics events in GA4 Realtime
4. ✅ Set up conversion goals in Google Ads
