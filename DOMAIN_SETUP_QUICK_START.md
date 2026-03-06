# Domain Setup Quick Start

## TL;DR - Connect GoDaddy Domain to Vercel

### 1. Add Domain in Vercel (2 minutes)
- Vercel Dashboard → Your Project → Settings → Domains
- Click "Add Domain"
- Enter your domain (e.g., `yourdomain.com`)
- **Copy the DNS values shown** (you'll need them next)

### 2. Update DNS in GoDaddy (5 minutes)
- GoDaddy → My Products → Domains → [Your Domain] → DNS
- Add **A Record:**
  - Type: `A`
  - Name: `@`
  - Value: `[IP from Vercel]` (e.g., `76.76.21.21`)
- Add **CNAME Record:**
  - Type: `CNAME`
  - Name: `www`
  - Value: `[CNAME from Vercel]` (e.g., `cname.vercel-dns.com`)
- Save both records

### 3. Wait for DNS (15 minutes - 2 hours)
- Check propagation: https://dnschecker.org
- Vercel will automatically issue SSL certificate
- Domain status in Vercel should show "Valid Configuration"

### 4. Update Environment Variables (2 minutes)
- Vercel → Settings → Environment Variables
- Update `NEXTAUTH_URL` to: `https://yourdomain.com` (no trailing slash)
- Update `ALLOWED_ORIGIN` to: `https://yourdomain.com` (if used)
- Set for **Production** environment
- Redeploy (automatic or manual)

### 5. Test (1 minute)
- Visit `https://yourdomain.com`
- Should see your site with padlock icon (SSL)
- Test login/signup to verify redirects work

## That's It! 🎉

Your domain should be live within 1-2 hours.

## Need Help?

See detailed guide: `GODADDY_DOMAIN_SETUP.md`

## Common Issues

**Domain not working?**
- Wait longer (DNS can take up to 48 hours)
- Double-check DNS records match Vercel exactly
- Verify domain shows "Valid Configuration" in Vercel

**SSL not working?**
- Wait 5-10 minutes after DNS propagates
- SSL certificate is automatic with Vercel

**Authentication broken?**
- Make sure `NEXTAUTH_URL` is exactly `https://yourdomain.com` (no trailing slash)
- Redeploy after updating environment variables
