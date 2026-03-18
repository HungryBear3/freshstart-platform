# Deriving DIRECT_DATABASE_URL for Prisma Migrations

When using Supabase's connection pooler (port 6543), `prisma migrate` can fail with:
```
Error: prepared statement "s1" already exists
```

**Fix:** Add `DIRECT_DATABASE_URL` to `.env.local` using the **direct** connection (port 5432).

## How to get the direct URL

1. Open **Supabase Dashboard** → your project → **Settings** → **Database**
2. Find **Connection string** and choose **URI** (not Transaction pooler)
3. Copy the URI — it should use port **5432** and host like `db.xxxxx.supabase.co` (no `.pooler`)
4. Add to `.env.local`:
   ```
   DIRECT_DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres?sslmode=require"
   ```

## Example

If your pooler URL is:
```
DATABASE_URL="postgresql://postgres.abc123:PASSWORD@aws-0-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

Your direct URL might be:
```
DIRECT_DATABASE_URL="postgresql://postgres.abc123:PASSWORD@aws-0-us-west-2.supabase.com:5432/postgres?sslmode=require"
```

Or (older Supabase format):
```
DIRECT_DATABASE_URL="postgresql://postgres:PASSWORD@db.abc123.supabase.co:5432/postgres?sslmode=require"
```

Check your Supabase project's **Connection string** section for the exact format.

## Then run

```powershell
cd newstart-il
npx prisma migrate dev --name add_user_badges_and_spouse_invites
```
