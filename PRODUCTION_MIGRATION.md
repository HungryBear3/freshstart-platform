# Production Database Migration Guide

## Visitor Counter Migration

To add the visitor counter feature to your production database, you need to run a migration.

## Option 1: Supabase SQL Editor (Easiest)

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Migration**
   - Copy the contents of `prisma/migrations/add-visitor-counter.sql`
   - Paste into the SQL Editor
   - Click "Run" or press `Ctrl+Enter`

4. **Verify**
   - Go to "Table Editor" in Supabase
   - You should see a new table called `visitor_counts`

## Option 2: Using Prisma Migrate (Requires Production DATABASE_URL)

If you have access to your production DATABASE_URL:

```bash
cd newstart-il

# Set production DATABASE_URL (don't commit this!)
$env:DATABASE_URL="your-production-database-url"

# Run migration
npx prisma migrate deploy
```

## Option 3: Vercel CLI (If Installed)

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
cd newstart-il
vercel link

# Pull production environment variables
vercel env pull .env.production

# Run migration with production env
$env:DATABASE_URL=(Get-Content .env.production | Select-String "DATABASE_URL").ToString().Split("=")[1]
npx prisma migrate deploy
```

## What This Migration Does

Creates the `visitor_counts` table with:
- `id` - Unique identifier
- `date` - Date of the visit (unique per day)
- `count` - Number of visitors for that day
- `createdAt` - Timestamp when record was created
- `updatedAt` - Timestamp when record was last updated

## Verification

After running the migration, test the visitor counter:
1. Visit your production site
2. Check the footer or homepage for the visitor counter
3. It should display the count (starts at 0 or 1)

## Troubleshooting

### "Table already exists" error
- This is fine - it means the table was already created
- The visitor counter should work

### "Permission denied" error
- Make sure you're using the correct database credentials
- Check that your database user has CREATE TABLE permissions

### Counter not showing
- Check browser console for errors
- Verify the API endpoint `/api/visitors` is accessible
- Check Vercel function logs for errors
