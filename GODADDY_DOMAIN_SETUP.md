# GoDaddy Domain Setup Guide for Vercel

This guide will help you connect your GoDaddy domain to your Vercel deployment.

## Prerequisites

- ✅ Domain purchased from GoDaddy
- ✅ Vercel account with deployed project
- ✅ Access to GoDaddy DNS management

## Step 1: Add Domain in Vercel

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Select your project (FreshStart-IL)

2. **Add Custom Domain**
   - Go to **Settings** → **Domains**
   - Click **Add Domain**
   - Enter your domain (e.g., `yourdomain.com` or `www.yourdomain.com`)
   - Click **Add**

3. **Vercel will show DNS configuration**
   - Vercel will display the DNS records you need to add
   - **Important:** Keep this page open - you'll need these values in the next step
   - You'll see something like:
     ```
     Type: A
     Name: @
     Value: 76.76.21.21
     
     Type: CNAME
     Name: www
     Value: cname.vercel-dns.com
     ```

## Step 2: Configure DNS in GoDaddy

### Option A: Using GoDaddy Website (Recommended)

1. **Log in to GoDaddy**
   - Go to https://www.godaddy.com
   - Sign in to your account
   - Go to **My Products** → **Domains**

2. **Access DNS Management**
   - Find your domain and click **DNS** (or **Manage DNS**)
   - This opens the DNS management page

3. **Add A Record (Root Domain)**
   - Click **Add** to create a new record
   - **Type:** Select `A`
   - **Name:** Enter `@` (represents root domain)
   - **Value:** Enter the IP address from Vercel (e.g., `76.76.21.21`)
   - **TTL:** Leave as default (600 seconds)
   - Click **Save**

4. **Add CNAME Record (WWW Subdomain)**
   - Click **Add** again
   - **Type:** Select `CNAME`
   - **Name:** Enter `www`
   - **Value:** Enter the CNAME from Vercel (e.g., `cname.vercel-dns.com`)
   - **TTL:** Leave as default
   - Click **Save**

5. **Remove Conflicting Records (if any)**
   - Look for any existing A or CNAME records pointing to other services
   - Delete or update them if they conflict
   - **Note:** Don't delete MX records (for email) unless you're moving email too

### Option B: Using GoDaddy DNS Manager

If you have access to advanced DNS settings:

1. Go to **DNS** → **DNS Management**
2. Find the **Records** section
3. Add the records exactly as shown in Vercel
4. Save changes

## Step 3: Wait for DNS Propagation

**Important:** DNS changes can take 24-48 hours to propagate, but usually work within 1-2 hours.

1. **Check DNS Propagation**
   - Use https://dnschecker.org to check if your DNS records have propagated
   - Enter your domain and check for A and CNAME records
   - Wait until records show globally

2. **Verify in Vercel**
   - Go back to Vercel → Settings → Domains
   - Your domain should show as **Valid Configuration** once DNS propagates
   - If it shows an error, double-check your DNS records

## Step 4: Update Environment Variables

Once your domain is connected, update Vercel environment variables:

1. **Go to Vercel Dashboard**
   - Project → Settings → Environment Variables

2. **Update NEXTAUTH_URL**
   - Find `NEXTAUTH_URL`
   - Update to: `https://yourdomain.com` (or `https://www.yourdomain.com` if using www)
   - **Important:** Use `https://` and no trailing slash
   - Make sure it's set for **Production** environment

3. **Update ALLOWED_ORIGIN (if used)**
   - Find `ALLOWED_ORIGIN`
   - Update to: `https://yourdomain.com`
   - Set for **Production** environment

4. **Redeploy**
   - After updating environment variables, Vercel will automatically redeploy
   - Or manually trigger: **Deployments** → **Redeploy**

## Step 5: Verify Domain Connection

1. **Test Your Domain**
   - Visit `https://yourdomain.com` in a browser
   - Your site should load (may take a few minutes after DNS propagation)

2. **Check SSL Certificate**
   - Vercel automatically provisions SSL certificates via Let's Encrypt
   - The certificate should be active within a few minutes
   - You should see a padlock icon in your browser

3. **Test Authentication**
   - Try signing up or signing in
   - Verify redirects work correctly
   - Check that cookies are set properly

## Step 6: Email Configuration (Optional)

If you want to use your domain email (e.g., `noreply@yourdomain.com`):

### Option A: Use GoDaddy Email (Included with Package)

1. **Set Up GoDaddy Email**
   - Go to GoDaddy → **My Products** → **Email**
   - Create email accounts (e.g., `noreply@yourdomain.com`)
   - Note the SMTP settings (usually):
     ```
     SMTP Host: smtpout.secureserver.net
     SMTP Port: 465 (SSL) or 587 (TLS)
     SMTP User: your-email@yourdomain.com
     SMTP Password: (your email password)
     ```

2. **Update Vercel Environment Variables**
   - Add to Vercel → Settings → Environment Variables:
     ```env
     SMTP_HOST=smtpout.secureserver.net
     SMTP_PORT=587
     SMTP_USER=noreply@yourdomain.com
     SMTP_PASSWORD=your-email-password
     SMTP_FROM=noreply@yourdomain.com
     ```
   - Set for **Production** environment

3. **Test Email**
   - Try the "Forgot Password" feature
   - Check if emails are received

### Option B: Use Third-Party Email Service (Recommended for Production)

For better deliverability, consider:
- **SendGrid** (free tier: 100 emails/day)
- **Mailgun** (free tier: 5,000 emails/month)
- **AWS SES** (very affordable)

These services provide:
- Better deliverability
- Email analytics
- SPF/DKIM records (better spam prevention)

## Troubleshooting

### Domain Not Resolving

**Problem:** Domain shows "Not Configured" in Vercel

**Solutions:**
1. **Check DNS Records**
   - Verify A record points to correct IP
   - Verify CNAME record is correct
   - Use https://dnschecker.org to check propagation

2. **Wait Longer**
   - DNS can take up to 48 hours
   - Usually works within 1-2 hours

3. **Clear DNS Cache**
   ```powershell
   # Windows PowerShell (run as Administrator)
   ipconfig /flushdns
   ```

### SSL Certificate Not Issued

**Problem:** Site loads but shows "Not Secure"

**Solutions:**
1. **Wait 5-10 minutes** after DNS propagation
2. **Check Vercel Dashboard** → Domains → Your domain
3. **Verify DNS is correct** - SSL won't issue if DNS isn't configured properly
4. **Contact Vercel Support** if it doesn't issue after 24 hours

### Authentication Redirects Not Working

**Problem:** After login, redirects go to vercel.app domain instead of custom domain

**Solutions:**
1. **Verify NEXTAUTH_URL**
   - Must be exactly `https://yourdomain.com` (no trailing slash)
   - Must be set for Production environment
   - Redeploy after updating

2. **Check Middleware**
   - Verify middleware allows your custom domain
   - Check `next.config.ts` for domain restrictions

### Email Not Sending

**Problem:** Emails not received

**Solutions:**
1. **Check SMTP Settings**
   - Verify all SMTP environment variables are set
   - Test with a simple email service first (Gmail SMTP)

2. **Check Spam Folder**
   - Emails might be going to spam
   - Set up SPF/DKIM records for better deliverability

3. **Check Vercel Logs**
   - Go to Vercel → Your Project → Logs
   - Look for email sending errors

### WWW vs Non-WWW

**Decision:** Choose one canonical domain

**Option 1: Redirect www to non-www**
- Add both `yourdomain.com` and `www.yourdomain.com` in Vercel
- Vercel will automatically redirect www to non-www

**Option 2: Redirect non-www to www**
- Add both domains in Vercel
- Configure redirect in `next.config.ts`:
  ```typescript
  async redirects() {
    return [
      {
        source: '/',
        has: [
          {
            type: 'host',
            value: 'yourdomain.com',
          },
        ],
        destination: 'https://www.yourdomain.com',
        permanent: true,
      },
    ]
  },
  ```

**Recommendation:** Use non-www (just `yourdomain.com`) for simplicity.

## DNS Record Reference

### For Root Domain (yourdomain.com)
```
Type: A
Name: @
Value: [IP from Vercel]
TTL: 600
```

### For WWW Subdomain (www.yourdomain.com)
```
Type: CNAME
Name: www
Value: [CNAME from Vercel]
TTL: 600
```

### For Email (if using GoDaddy email)
```
Type: MX
Name: @
Value: smtp.secureserver.net
Priority: 0
TTL: 3600
```

## Quick Checklist

- [ ] Domain added in Vercel Dashboard
- [ ] A record added in GoDaddy DNS (for root domain)
- [ ] CNAME record added in GoDaddy DNS (for www)
- [ ] DNS propagated (checked via dnschecker.org)
- [ ] Domain shows "Valid Configuration" in Vercel
- [ ] SSL certificate issued (padlock icon in browser)
- [ ] NEXTAUTH_URL updated in Vercel environment variables
- [ ] ALLOWED_ORIGIN updated (if used)
- [ ] Site accessible at https://yourdomain.com
- [ ] Authentication working correctly
- [ ] Email configured (if needed)

## Next Steps After Domain Setup

1. **Update Social Media Links**
   - Update any social media profiles with new domain
   - Update email signatures

2. **Set Up Analytics**
   - Add Google Analytics or similar
   - Update tracking codes

3. **Configure SEO**
   - Update sitemap.xml with new domain
   - Submit to Google Search Console
   - Update robots.txt if needed

4. **Monitor Performance**
   - Check Vercel Analytics
   - Monitor error logs
   - Set up uptime monitoring

## Support Resources

- **Vercel Domain Docs:** https://vercel.com/docs/concepts/projects/domains
- **GoDaddy DNS Help:** https://www.godaddy.com/help/manage-dns-680
- **DNS Checker:** https://dnschecker.org
- **Vercel Support:** support@vercel.com

---

**Note:** If you encounter any issues, check Vercel's domain status page and GoDaddy's DNS management. Most issues resolve after DNS propagation completes.
