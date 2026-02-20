# Post-Deployment Steps

## Step 1: Update Environment Variables After First Deployment

### After Vercel Deployment

1. **Get Your Vercel URL**
   - Go to Vercel Dashboard: https://vercel.com/dashboard
   - Click on your project: `FreshStart-IL`
   - Your URL will be something like: `https://freshstart-il-abc123.vercel.app`
   - Or if you set a custom domain, use that

2. **Update Environment Variables**
   - In Vercel Dashboard, go to: **Project Settings** → **Environment Variables**
   - Find `NEXTAUTH_URL` and click **Edit**
   - Update value to: `https://your-actual-vercel-url.vercel.app`
   - Make sure it's set for **Production** environment
   - Click **Save**
   
   - Find `ALLOWED_ORIGIN` and click **Edit**
   - Update value to: `https://your-actual-vercel-url.vercel.app`
   - Make sure it's set for **Production** environment
   - Click **Save**

3. **Redeploy**
   - Go to **Deployments** tab
   - Click the **three dots** (⋯) on the latest deployment
   - Click **Redeploy**
   - Or simply push a new commit to trigger auto-deployment

## Step 2: Run Database Migrations

### Option A: Using Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click **SQL Editor** in the left sidebar
   - Click **New query**

3. **Run Prisma Migrations**
   - The easiest way is to use Prisma's migration SQL
   - Or run: `npx prisma migrate deploy` locally and copy the SQL
   
   **Alternative: Push Schema Directly**
   ```bash
   # In your local project
   cd newstart-il
   npx prisma db push
   ```
   This will sync your schema to the database.

### Option B: Using Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed)
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Link Your Project**
   ```bash
   cd "C:\Users\alkap\.cursor\FreshStart IL\ai-dev-tasks\newstart-il"
   vercel link
   ```
   - Select your project when prompted
   - Select the scope (your account)

4. **Pull Environment Variables**
   ```bash
   vercel env pull .env.local
   ```
   This downloads your Vercel environment variables to `.env.local`

5. **Run Migrations**
   ```bash
   # Generate Prisma Client
   npm run db:generate
   
   # Deploy migrations to production database
   npx prisma migrate deploy
   ```
   
   **Or push schema directly:**
   ```bash
   npx prisma db push
   ```

### Option C: Using Prisma Studio (For Development)

```bash
# Connect to production database (make sure DATABASE_URL is set)
npx prisma studio
```

This opens a visual editor at http://localhost:5555

## Step 3: Test Your Application

### Basic Functionality Tests

1. **Visit Your Deployed URL**
   - Go to: `https://your-app.vercel.app`
   - Check if the homepage loads

2. **Test User Registration**
   - Click "Sign Up" or navigate to `/auth/signup`
   - Create a test account
   - Verify email (if email verification is enabled)
   - Try logging in

3. **Test Authentication**
   - Sign in with your test account
   - Check if you're redirected to dashboard
   - Verify session persists on page refresh

4. **Test Database Connection**
   - After logging in, try accessing:
     - `/dashboard/financial` - Should load financial data
     - `/dashboard/case` - Should load case information
     - `/dashboard/parenting` - Should load children data
   
   If these pages load without errors, database is connected ✅

5. **Test API Endpoints**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Try actions like:
     - Creating a child
     - Adding financial data
     - Creating a milestone
   - Check for 200 status codes (success) or error messages

### Check Vercel Logs

1. **View Logs**
   - Go to Vercel Dashboard → Your Project
   - Click **Logs** tab
   - Look for any errors (red text)
   - Check for database connection errors
   - Look for authentication errors

2. **Common Issues to Check**
   - ❌ Database connection errors → Check DATABASE_URL
   - ❌ Authentication errors → Check NEXTAUTH_URL and NEXTAUTH_SECRET
   - ❌ CORS errors → Check ALLOWED_ORIGIN
   - ❌ Build errors → Check build logs

### Test Critical Features

**Financial Tools:**
- ✅ Child Support Calculator: `/dashboard/financial/child-support`
- ✅ Spousal Maintenance: `/dashboard/financial/spousal-maintenance`
- ✅ Financial Affidavit: `/dashboard/financial/affidavit`

**Case Management:**
- ✅ Case Information: `/dashboard/case`
- ✅ Milestones: Create and view milestones
- ✅ Deadlines: Check deadline calculations

**Parenting Plan:**
- ✅ Children Management: `/dashboard/parenting`
- ✅ Add/edit children
- ✅ Parenting plan builder

**Documents:**
- ✅ Generate PDFs (Financial Affidavit, Parenting Plan)

## Step 4: Verify Everything Works

### Checklist

- [ ] Homepage loads
- [ ] User registration works
- [ ] User login works
- [ ] Dashboard loads after login
- [ ] Database connection works (no errors in logs)
- [ ] Can create/view children
- [ ] Can add financial data
- [ ] Can create milestones
- [ ] Can generate PDFs
- [ ] No errors in Vercel logs
- [ ] Environment variables updated correctly

## Troubleshooting

### Database Connection Issues

**Error: "Can't reach database server"**
- Check DATABASE_URL is correct
- Verify Supabase allows external connections
- Check if SSL is required (`?sslmode=require`)

**Error: "Authentication failed"**
- Verify database password is correct
- Check if user has proper permissions

### Authentication Issues

**Error: "NEXTAUTH_URL mismatch"**
- Verify NEXTAUTH_URL matches your actual domain exactly
- Make sure it includes `https://`
- No trailing slash

**Error: "Invalid NEXTAUTH_SECRET"**
- Verify NEXTAUTH_SECRET is set
- Make sure it's the same value you generated
- Check for any extra spaces or characters

### CORS Issues

**Error: "CORS policy blocked"**
- Verify ALLOWED_ORIGIN matches your domain
- Make sure it includes `https://`
- No trailing slash

## Quick Commands Reference

```bash
# Navigate to project
cd "C:\Users\alkap\.cursor\FreshStart IL\ai-dev-tasks\newstart-il"

# Link to Vercel
vercel link

# Pull environment variables
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy

# Or push schema
npx prisma db push

# Generate Prisma Client
npm run db:generate

# Test database connection
npm run db:test
```

## Next Steps After Testing

1. ✅ **Monitor Logs** - Check Vercel logs regularly
2. ✅ **Set Up Error Tracking** - Configure Sentry if using
3. ✅ **Set Up Custom Domain** - Add your own domain (optional)
4. ✅ **Configure Monitoring** - Set up alerts for errors
5. ✅ **Review Security** - Ensure all security measures are active

## Need Help?

- **Vercel Logs:** Dashboard → Project → Logs
- **Supabase Logs:** Dashboard → Project → Logs
- **Prisma Issues:** Check `prisma/schema.prisma` and database connection
- **NextAuth Issues:** Check environment variables and logs
