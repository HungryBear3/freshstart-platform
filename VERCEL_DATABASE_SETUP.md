# Vercel Database Connection Setup

## Current Issue

The database connection is failing with error `P2010: Can't reach database server`. This is because:

1. **Port is undefined** - The connection string might not be parsing the port correctly
2. **Wrong connection type** - Direct connection (port 5432) doesn't work well with Vercel serverless

## Solution: Use Supabase Connection Pooler

For Vercel/serverless environments, you **must** use Supabase's connection pooler (port 6543) instead of the direct connection (port 5432).

## Steps to Fix

### 1. Get Your Connection Pooler URL

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **Database**
4. Scroll to **Connection string** section
5. Select the **Connection pooling** tab (not "URI")
6. Copy the connection string - it should look like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:6543/postgres?sslmode=require&pgbouncer=true
   ```

### 2. Set in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Find or add `DATABASE_URL`
4. **Paste the connection pooler URL** (port 6543)
5. Make sure it's enabled for:
   - ✅ Production
   - ✅ Preview (optional)
   - ✅ Development (optional)
6. Click **Save**

### 3. Important: Connection String Format

The connection string **must** include:
- Port `6543` (connection pooler)
- `?sslmode=require&pgbouncer=true` at the end

**Correct format:**
```
postgresql://postgres:PRWgCQEQ2RO78zCk@db.oscljrviecbgevotjovj.supabase.co:6543/postgres?sslmode=require&pgbouncer=true
```

**Wrong format (direct connection - won't work on Vercel):**
```
postgresql://postgres:PRWgCQEQ2RO78zCk@db.oscljrviecbgevotjovj.supabase.co:5432/postgres
```

### 4. Redeploy

After setting the environment variable:
1. Go to **Deployments** tab in Vercel
2. Click **Redeploy** on the latest deployment
3. Or push a new commit to trigger a deployment

## Why Connection Pooler?

- ✅ **Optimized for serverless** - Handles connection pooling automatically
- ✅ **Faster cold starts** - Reduces connection overhead
- ✅ **More reliable** - Designed for serverless environments
- ✅ **Prevents connection limits** - Avoids hitting Supabase connection limits

## Verify It's Working

After redeploying, check the Vercel function logs:
- Should see successful database queries
- Visitor counter should start incrementing
- No more `P2010` or `DatabaseNotReachable` errors

## Troubleshooting

If you still see connection errors:

1. **Verify the connection string** - Make sure it has port `6543` and `pgbouncer=true`
2. **Check Supabase project status** - Make sure it's "Active" in Supabase dashboard
3. **Check Vercel environment variables** - Verify `DATABASE_URL` is set for Production
4. **Wait a few minutes** - Sometimes it takes a moment for changes to propagate
