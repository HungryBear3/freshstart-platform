# End-to-End Testing Checklist

Complete this checklist before launching your Google Ads campaign to ensure everything works correctly.

## Prerequisites

- [ ] All environment variables set in Vercel (see `VERCEL_ENV_SETUP.md`)
- [ ] Production site deployed and accessible
- [ ] Stripe test mode configured
- [ ] Database connected and working

---

## 1. User Registration & Authentication ✅

### Sign Up Flow

- [ ] Visit `/auth/signup`
- [ ] Fill out registration form with test email
- [ ] Submit form
- [ ] Verify redirect to sign-in page
- [ ] Check email for verification link (or check console logs in dev)
- [ ] Click verification link
- [ ] Verify email is marked as verified

### Sign In Flow

- [ ] Visit `/auth/signin`
- [ ] Enter credentials
- [ ] Sign in successfully
- [ ] Verify redirect to `/dashboard`

### Protected Routes

- [ ] While logged out, try accessing `/dashboard`
- [ ] Verify redirect to `/auth/signin`
- [ ] After sign in, verify access to dashboard

---

## 2. Payment & Subscription Flow 💳

### Checkout Process

- [ ] Sign in to your test account
- [ ] Visit `/pricing` page
- [ ] Click "Start Free Trial" button
- [ ] Verify redirect to Stripe Checkout
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Use any future expiry date (e.g., `12/34`)
- [ ] Use any 3-digit CVC (e.g., `123`)
- [ ] Use any ZIP code (e.g., `12345`)
- [ ] Complete checkout
- [ ] Verify redirect to `/dashboard?success=true`

### Subscription Verification

- [ ] Check Stripe Dashboard → **Customers**
- [ ] Verify customer was created
- [ ] Check **Subscriptions** tab
- [ ] Verify subscription is active with 7-day trial
- [ ] Check database (via Prisma Studio or admin panel)
- [ ] Verify subscription record exists in `subscriptions` table

### Test Refund (Important!)

- [ ] Go to Stripe Dashboard → **Payments**
- [ ] Find your test payment
- [ ] Click **Refund** button
- [ ] Select **Full refund**
- [ ] Confirm refund
- [ ] Verify refund status shows as "Refunded"

---

## 3. Questionnaire & Document Generation 📝

### Start Questionnaire

- [ ] While logged in with active subscription, go to dashboard
- [ ] Click on "Questionnaires" or navigate to questionnaire page
- [ ] Select "Petition for Dissolution of Marriage" (recommended for testing)
- [ ] Fill out first section
- [ ] Verify progress is saved
- [ ] Complete multiple sections
- [ ] Verify you can navigate back and forth

### Complete Questionnaire

- [ ] Fill out all required fields
- [ ] Submit questionnaire
- [ ] Verify status changes to "completed"
- [ ] Check that questionnaire response is saved in database

### Generate Document

- [ ] After completing questionnaire, click "Generate Document"
- [ ] Wait for document generation to complete
- [ ] Verify document appears in documents list
- [ ] Click on document to view
- [ ] Verify document content is correct
- [ ] Test document download

### Download Document Package

- [ ] If multiple documents exist, test "Download All" or package download
- [ ] Verify ZIP file downloads correctly
- [ ] Extract and verify all documents are included

---

## 4. Mobile Responsiveness 📱

### iPhone Testing

- [ ] Test on iPhone (Safari browser)
- [ ] Verify homepage loads correctly
- [ ] Test sign up flow
- [ ] Test sign in flow
- [ ] Test pricing page
- [ ] Test dashboard layout
- [ ] Test questionnaire on mobile
- [ ] Test document viewing/downloading

### Android Testing

- [ ] Test on Android device (Chrome browser)
- [ ] Repeat all iPhone tests above
- [ ] Verify touch interactions work
- [ ] Check form inputs are accessible
- [ ] Verify buttons are tappable

### Responsive Design Checks

- [ ] Test at 375px width (iPhone SE)
- [ ] Test at 768px width (iPad)
- [ ] Test at 1024px width (Desktop)
- [ ] Verify no horizontal scrolling
- [ ] Check text is readable at all sizes

---

## 5. Analytics Tracking Verification 📊

### Google Analytics 4

- [ ] Visit your live site
- [ ] Open [GA4 Realtime](https://analytics.google.com/analytics/web/#/realtime)
- [ ] Verify your visit appears within 30 seconds
- [ ] Navigate to different pages
- [ ] Verify page views are tracked
- [ ] Complete a sign up
- [ ] Verify `sign_up` event appears in Realtime
- [ ] Complete a purchase (test)
- [ ] Verify `purchase` event appears (may take a few minutes)

### Google Ads Conversion

- [ ] Complete a test purchase
- [ ] In Google Ads, go to **Tools & Settings** → **Conversions**
- [ ] Check your conversion action
- [ ] Note: Conversions may take 3-24 hours to appear in reports
- [ ] Use [Google Tag Assistant](https://tagassistant.google.com/) to verify tag is firing

### Meta Pixel

- [ ] Install [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc) Chrome extension
- [ ] Visit your live site
- [ ] Extension should show Pixel ID and events
- [ ] Navigate pages and verify `PageView` events
- [ ] Complete sign up and verify `Lead` event
- [ ] Complete purchase and verify `Purchase` event

---

## 6. Marketing Links Setup 🔗

### Create Marketing Links

- [ ] Sign in as admin (or use admin panel)
- [ ] Navigate to `/admin/marketing-links`
- [ ] Click "Create Link"
- [ ] Create link for Google Ads:
  - Name: "Google Ads - Divorce IL Campaign"
  - Source: `google`
  - Medium: `cpc`
  - Campaign: `divorce_il`
- [ ] Create link for Facebook Ads:
  - Name: "Facebook - Awareness Campaign"
  - Source: `facebook`
  - Medium: `cpc`
  - Campaign: `awareness`
- [ ] Copy the generated short URLs (e.g., `yoursite.com/go/google-ads-divorce`)

### Test Marketing Links

- [ ] Click on a marketing link
- [ ] Verify redirect to correct page with UTM parameters
- [ ] Check URL contains `?utm_source=...&utm_medium=...&utm_campaign=...`
- [ ] Complete sign up through marketing link
- [ ] Verify UTM parameters are stored in user record
- [ ] Check attribution dashboard shows the source

---

## 7. Contact Form & Email 📧

### Contact Form (if applicable)

- [ ] Find contact form on site
- [ ] Fill out form with test data
- [ ] Submit form
- [ ] Verify success message appears
- [ ] Check email inbox (or console logs) for form submission
- [ ] Verify email contains correct information

### Email Delivery

- [ ] Test password reset email
- [ ] Test email verification email
- [ ] Verify emails are delivered (check spam folder)
- [ ] Verify email links work correctly

---

## 8. SSL & Security 🔒

### SSL Certificate

- [ ] Visit site with `https://` (not `http://`)
- [ ] Verify browser shows padlock icon
- [ ] Check certificate is valid (click padlock → Certificate)
- [ ] Verify no mixed content warnings

### Security Headers

- [ ] Use [SecurityHeaders.com](https://securityheaders.com/) to check headers
- [ ] Verify security headers are present:
  - `X-Frame-Options`
  - `X-Content-Type-Options`
  - `X-XSS-Protection`
  - `Strict-Transport-Security` (if HTTPS)

---

## 9. Performance Checks ⚡

### Page Load Speed

- [ ] Use [PageSpeed Insights](https://pagespeed.web.dev/)
- [ ] Test homepage
- [ ] Test dashboard page
- [ ] Aim for score above 80 (mobile and desktop)

### Core Web Vitals

- [ ] Check Largest Contentful Paint (LCP) < 2.5s
- [ ] Check First Input Delay (FID) < 100ms
- [ ] Check Cumulative Layout Shift (CLS) < 0.1

---

## 10. Error Handling 🐛

### 404 Page

- [ ] Visit non-existent page (e.g., `/this-does-not-exist`)
- [ ] Verify custom 404 page appears
- [ ] Verify page has navigation back to home

### Error Boundaries

- [ ] Test error scenarios (if possible)
- [ ] Verify errors don't break entire app
- [ ] Verify error messages are user-friendly

---

## Final Verification ✅

Before launching ads, confirm:

- [ ] All checkboxes above are completed
- [ ] Test purchase completed and refunded
- [ ] Analytics tracking verified in all platforms
- [ ] Marketing links created and tested
- [ ] Mobile experience is good
- [ ] SSL certificate is valid
- [ ] No critical errors in browser console
- [ ] All forms submit correctly
- [ ] Payment flow works end-to-end

---

## Quick Test Script

For a quick smoke test, run through this sequence:

1. **Sign up** → `/auth/signup`
2. **Sign in** → `/auth/signin`
3. **View pricing** → `/pricing`
4. **Start checkout** → Click "Start Free Trial"
5. **Complete payment** → Use test card `4242 4242 4242 4242`
6. **Return to dashboard** → Should see success message
7. **Start questionnaire** → Complete at least one section
8. **Generate document** → Verify document appears
9. **Check analytics** → Verify events in GA4 Realtime

If all steps complete without errors, you're ready to launch! 🚀

---

## Notes

- **Test cards:** Always use Stripe test cards for testing
- **Refunds:** Always refund test purchases to keep Stripe dashboard clean
- **Analytics delay:** Some analytics events may take time to appear (especially Google Ads conversions)
- **Mobile testing:** Use real devices when possible, not just browser dev tools
