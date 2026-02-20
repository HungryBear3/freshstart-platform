# Vercel Deployment Setup Guide

## Quick Setup (Recommended - Using Dashboard)

### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Click "Sign Up"
3. Sign up with GitHub (recommended - easier integration)

### Step 2: Import Your Repository
1. After signing in, click "Add New..." → "Project"
2. Import from GitHub: `HungryBear3/FreshStart-IL`
3. Select the repository
4. Click "Import"

### Step 3: Configure Project Settings

**Framework Preset:** Next.js (should auto-detect)

**Root Directory:** 
- If your code is in `newstart-il` folder, set: `newstart-il`
- If code is at root, leave blank

**Build Command:** `npm run build` (default)
**Output Directory:** `.next` (default)
**Install Command:** `npm install` (default)

### Step 4: Set Environment Variables

Click "Environment Variables" and add these:

#### Required Variables:

```bash
# NextAuth Configuration
NEXTAUTH_URL=https://your-app-name.vercel.app
# (Update after first deployment with your actual domain)

NEXTAUTH_SECRET=<generate-secret-below>

# Database
DATABASE_URL=postgresql://postgres:password@host:5432/database?sslmode=require
# (Your Supabase connection string)

# Node Environment
NODE_ENV=production

# Encryption Key (for sensitive data)
ENCRYPTION_KEY=<generate-secret-below>

# CORS
ALLOWED_ORIGIN=https://your-app-name.vercel.app
# (Update after first deployment)
```

#### Optional Variables:

```bash
# Error Tracking (if using Sentry)
SENTRY_DSN=your-sentry-dsn

# Email (if using SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@your-domain.com

# File Storage (if using S3)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=your-bucket
AWS_REGION=us-east-1

# Database SSL (if needed)
DATABASE_SSL=true
```

### Step 5: Generate Secrets

**For Windows PowerShell:**
```powershell
# Generate NEXTAUTH_SECRET
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Generate ENCRYPTION_KEY
-join ((48..57) + (65..70) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
```

**Or use online generator:**
- NEXTAUTH_SECRET: https://generate-secret.vercel.app/32
- ENCRYPTION_KEY: Use a 64-character hex string generator

### Step 6: Deploy

1. Click "Deploy"
2. Wait for build to complete (usually 2-5 minutes)
3. Your app will be live at: `https://your-app-name.vercel.app`

### Step 7: Update Environment Variables

After first deployment:
1. Go to Project Settings → Environment Variables
2. Update `NEXTAUTH_URL` with your actual domain
3. Update `ALLOWED_ORIGIN` with your actual domain
4. Redeploy (Vercel will auto-redeploy on next push)

## Post-Deployment Steps

### 1. Run Database Migrations

After deployment, you need to run Prisma migrations:

**Option A: Using Vercel CLI**
```bash
npm i -g vercel
vercel login
vercel link
vercel env pull .env.local
npx prisma migrate deploy
```

**Option B: Using Supabase Dashboard**
- Go to Supabase SQL Editor
- Run migrations manually if needed

### 2. Verify Deployment

1. Visit your deployed URL
2. Test user registration
3. Check error logs in Vercel dashboard
4. Verify database connection

### 3. Set Up Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXTAUTH_URL` and `ALLOWED_ORIGIN` environment variables

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Common issues:
  - Missing environment variables
  - Database connection issues
  - TypeScript errors

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check Supabase allows connections from Vercel IPs
- Ensure SSL is enabled in connection string

### Authentication Not Working
- Verify `NEXTAUTH_URL` matches your domain
- Check `NEXTAUTH_SECRET` is set
- Review NextAuth logs in Vercel

### Environment Variables Not Working
- Make sure variables are set for "Production" environment
- Redeploy after adding variables
- Check variable names match exactly (case-sensitive)

## Continuous Deployment

Once set up, Vercel will automatically deploy:
- On every push to `main` branch (production)
- On every push to other branches (preview deployments)

## Monitoring

- View logs: Vercel Dashboard → Your Project → Logs
- View analytics: Vercel Dashboard → Analytics
- Set up alerts: Project Settings → Notifications

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Run database migrations
3. ✅ Test all functionality
4. ✅ Set up custom domain (optional)
5. ✅ Configure monitoring
6. ✅ Set up error tracking (Sentry)
