# Quick Test Commands

## Update Environment Variables in Vercel

### Via Dashboard (Easiest)
1. Go to: https://vercel.com/dashboard
2. Click your project: **FreshStart-IL**
3. Go to: **Settings** → **Environment Variables**
4. Find and edit:
   - `NEXTAUTH_URL` → Update to your Vercel URL
   - `ALLOWED_ORIGIN` → Update to your Vercel URL
5. Click **Save**
6. Go to **Deployments** → Click **⋯** → **Redeploy**

## Run Migrations

### Quick Method (Using Prisma Push)
```bash
cd "C:\Users\alkap\.cursor\FreshStart IL\ai-dev-tasks\newstart-il"

# Pull environment variables from Vercel (if using CLI)
vercel env pull .env.local

# Push schema to database
npx prisma db push
```

### Using Vercel CLI
```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Login
vercel login

# Link project
cd "C:\Users\alkap\.cursor\FreshStart IL\ai-dev-tasks\newstart-il"
vercel link

# Pull environment variables
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy
```

## Test Your App

### 1. Basic Test
Open in browser: `https://your-app.vercel.app`

### 2. Test Registration
- Go to: `https://your-app.vercel.app/auth/signup`
- Create a test account
- Check if it works

### 3. Test Login
- Go to: `https://your-app.vercel.app/auth/signin`
- Login with test account
- Should redirect to dashboard

### 4. Test Database Connection
After login, try:
- `https://your-app.vercel.app/dashboard/financial`
- `https://your-app.vercel.app/dashboard/case`
- `https://your-app.vercel.app/dashboard/parenting`

If these load without errors → Database connected ✅

### 5. Check Logs
- Go to Vercel Dashboard → Your Project → **Logs**
- Look for errors (red text)
- Check for database connection issues

## Quick Checklist

```bash
# 1. Update environment variables in Vercel dashboard
# 2. Redeploy

# 3. Run migrations
npx prisma db push

# 4. Test in browser
# - Visit your Vercel URL
# - Try registration
# - Try login
# - Check dashboard pages

# 5. Check logs
# - Vercel Dashboard → Logs
```

## Common Issues

**"Database connection failed"**
→ Check DATABASE_URL in Vercel environment variables

**"NEXTAUTH_URL mismatch"**
→ Update NEXTAUTH_URL to match your Vercel domain exactly

**"CORS error"**
→ Update ALLOWED_ORIGIN to match your Vercel domain
