# Quick Guide: Setting Up GoDaddy Email

This guide will walk you through setting up GoDaddy email for NewStart IL in about 10 minutes.

---

## Step 1: Create Email Account in GoDaddy (5 minutes)

### 1. Log in to GoDaddy
- Go to https://www.godaddy.com
- Sign in to your account
- Navigate to **My Products** → **Domains**

### 2. Access Email Settings
- Find your domain (`freshstart-il.com` or your domain)
- Click **DNS** or **Manage DNS**
- Look for **Email** section or **Email Accounts** tab
- OR go directly to **My Products** → **Email** (if email is separate)

### 3. Create Email Account
- Click **Add** or **Create Email Account**
- Enter email address: `support@freshstart-il.com`
- Enter password (use a strong password!)
- Click **Create** or **Save**

**Note:** If email isn't included in your GoDaddy package:
- You may need to purchase email hosting
- Or upgrade your GoDaddy package
- Alternative: Use a third-party email service (see below)

---

## Step 2: Get SMTP Settings (2 minutes)

Once your email account is created, note these SMTP settings:

```
SMTP Host: smtpout.secureserver.net
SMTP Port: 587 (TLS) or 465 (SSL)
SMTP User: support@freshstart-il.com
SMTP Password: [Your email account password]
SMTP From: support@freshstart-il.com
```

**Common GoDaddy SMTP Settings:**
- **Host:** `smtpout.secureserver.net` (most common)
- **Port:** `587` (TLS - recommended) or `465` (SSL)
- **Security:** TLS for port 587, SSL for port 465

---

## Step 3: Add to Vercel Environment Variables (3 minutes)

### Option A: Using Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Select your project (FreshStart-IL or similar)

2. **Navigate to Environment Variables**
   - Go to **Settings** → **Environment Variables**

3. **Add SMTP Variables**
   Add these 5 variables one by one:

   **Variable 1:**
   - Name: `SMTP_HOST`
   - Value: `smtpout.secureserver.net`
   - Environment: Select **Production** (and **Preview** if you want to test)

   **Variable 2:**
   - Name: `SMTP_PORT`
   - Value: `587`
   - Environment: **Production** (and **Preview** if needed)

   **Variable 3:**
   - Name: `SMTP_USER`
   - Value: `support@freshstart-il.com`
   - Environment: **Production** (and **Preview** if needed)

   **Variable 4:**
   - Name: `SMTP_PASSWORD`
   - Value: `[Your email account password]`
   - Environment: **Production** (and **Preview** if needed)
   - ⚠️ **Important:** This is sensitive - keep it secure!

   **Variable 5:**
   - Name: `SMTP_FROM`
   - Value: `support@freshstart-il.com`
   - Environment: **Production** (and **Preview** if needed)

4. **Save and Redeploy**
   - Click **Save** after adding each variable
   - Go to **Deployments** tab
   - Click **Redeploy** on the latest deployment
   - Or push a new commit to trigger automatic deployment

### Option B: Using Vercel CLI (Advanced)

If you prefer using the command line:

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Link your project (if not already linked)
cd newstart-il
vercel link

# Add environment variables
vercel env add SMTP_HOST production
# Enter: smtpout.secureserver.net

vercel env add SMTP_PORT production
# Enter: 587

vercel env add SMTP_USER production
# Enter: support@freshstart-il.com

vercel env add SMTP_PASSWORD production
# Enter: [Your password]

vercel env add SMTP_FROM production
# Enter: support@freshstart-il.com

# Deploy
vercel --prod
```

---

## Step 4: Test Email (2 minutes)

### Test with Password Reset Feature

1. **Go to your website**
   - Visit https://www.freshstart-il.com (or your domain)
   - Go to **Sign In** page
   - Click **Forgot Password?**

2. **Request Password Reset**
   - Enter an email address you have access to
   - Click **Send Reset Link**

3. **Check Email**
   - Check the inbox of the email you entered
   - **Check spam folder too!**
   - You should receive a password reset email

4. **Verify Email Content**
   - Email should be from `support@freshstart-il.com`
   - Should contain a reset link
   - Should look professional

### Troubleshooting

**Email Not Received:**
- Check spam/junk folder
- Wait 2-3 minutes (sometimes delayed)
- Check Vercel function logs:
  1. Go to Vercel Dashboard → Your Project → Functions
  2. Look for `/api/auth/forgot-password` function
  3. Check logs for errors

**SMTP Error in Logs:**
- Verify SMTP settings are correct
- Check password is correct
- Try port `465` instead of `587` (or vice versa)
- Verify email account exists in GoDaddy

**"Email logged (SMTP not configured)" in console:**
- This means environment variables aren't set
- Go back to Step 3 and verify all variables are added
- Make sure you redeployed after adding variables

---

## Alternative: Use a Third-Party Email Service

If GoDaddy email doesn't work or isn't available, consider:

### Option 1: SendGrid (Recommended for Production)
- **Free tier:** 100 emails/day forever
- **Setup:** 15-20 minutes
- **Better deliverability** than GoDaddy
- **Instructions:** See `EMAIL_AND_PAYMENT_SETUP.md`

### Option 2: Mailgun
- **Free tier:** 5,000 emails/month (first 3 months), then 100/day
- **Setup:** 15-20 minutes
- **Good deliverability**

### Option 3: AWS SES
- **Very affordable:** $0.10 per 1,000 emails
- **Setup:** 20-30 minutes
- **No free tier**, but very cheap

---

## Quick Checklist

✅ Email account created in GoDaddy (`support@freshstart-il.com`)  
✅ SMTP settings noted  
✅ Environment variables added to Vercel:
  - ✅ `SMTP_HOST` = `smtpout.secureserver.net`
  - ✅ `SMTP_PORT` = `587`
  - ✅ `SMTP_USER` = `support@freshstart-il.com`
  - ✅ `SMTP_PASSWORD` = `[Your password]`
  - ✅ `SMTP_FROM` = `support@freshstart-il.com`  
✅ Project redeployed  
✅ Test email sent successfully  
✅ Email received (check spam folder)  

---

## What Happens Next?

Once email is set up:

1. **User Registration:** Users will receive verification emails
2. **Password Reset:** Users can reset passwords via email
3. **Contact Inquiries:** You'll receive emails at `support@freshstart-il.com`

### Email Forwarding (Optional)

You can forward emails to your personal email:

1. In GoDaddy, go to email settings
2. Find "Forwarding" option
3. Set `support@freshstart-il.com` → `your-personal@email.com`
4. Keep copy in GoDaddy mailbox (optional)

This way you can check support emails from your personal email client.

---

## Need Help?

If you run into issues:

1. **Check Vercel Logs:**
   - Vercel Dashboard → Your Project → Functions → Logs
   - Look for email-related errors

2. **Verify GoDaddy Email:**
   - Log into GoDaddy email webmail
   - Send a test email from the webmail
   - Verify email account is active

3. **Test SMTP Settings:**
   - Use an email client (Outlook, Thunderbird) to test SMTP
   - If it works in email client, settings are correct

4. **Contact Support:**
   - Check `EMAIL_AND_PAYMENT_SETUP.md` for alternative email services
   - Consider SendGrid for better reliability

---

*Total Setup Time: ~10 minutes*  
*Last Updated: January 2025*
