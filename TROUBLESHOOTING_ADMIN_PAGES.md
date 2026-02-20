# Troubleshooting Admin Pages Not Loading

## Issue
Admin pages (`/admin/*`) are not loading - showing internal server error or infinite loading.

## Possible Causes

### 1. Server Build Issues
The server may need to rebuild after code changes.

**Solution:**
- Wait 30-60 seconds after making changes
- Check server terminal for build errors
- Try restarting the dev server:
  ```bash
  # Stop server (Ctrl+C)
  cd newstart-il
  npm run dev
  ```

### 2. Next.js Cache Issues
Build cache might be corrupted.

**Solution:**
```bash
cd newstart-il
# Delete build cache
Remove-Item -Recurse -Force .next
# Restart server
npm run dev
```

### 3. Database Connection
If pages try to access database on load, connection issues will cause errors.

**Solution:**
- Check `.env.local` has correct `DATABASE_URL`
- Verify database is accessible
- Check Prisma client is generated: `npm run db:generate`

### 4. Component Import Errors
If a component used in the page has errors, the page won't load.

**Solution:**
- Check browser console (F12) for errors
- Check server terminal for build errors
- Look for TypeScript errors: `npm run type-check`

## Quick Test

1. **Test simple route:**
   - Navigate to: `http://localhost:3000/admin/test-simple`
   - If this doesn't work, routing is broken

2. **Test API directly:**
   - Open browser console (F12)
   - Run: `fetch('/api/admin/seed-test-user', {method: 'POST'}).then(r => r.json()).then(console.log)`
   - This will show if API works

3. **Check server logs:**
   - Look at the terminal where `npm run dev` is running
   - Look for error messages

## Alternative: Create User via Command Line

If the web interface doesn't work, you can create the test user via command line:

```bash
cd newstart-il
npm run seed:test-user
```

Note: This may have Prisma client issues. If so, use the API endpoint directly or create user manually via Prisma Studio:

```bash
npm run db:studio
```

Then manually create a user with:
- Email: test@example.com
- Password: (hash of "test123456" using bcrypt)
- Name: Test User
- emailVerified: (current date)

## Manual User Creation via SQL

If all else fails, you can create the user directly in the database:

1. Connect to your Supabase database
2. Run this SQL (you'll need to hash the password first):

```sql
-- First, you need to hash "test123456" using bcrypt
-- Use an online bcrypt generator or Node.js:
-- const bcrypt = require('bcryptjs');
-- bcrypt.hash('test123456', 12).then(console.log);

INSERT INTO users (id, email, password, name, "emailVerified", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid()::text,
  'test@example.com',
  '$2a$12$...hashed_password_here...',
  'Test User',
  NOW(),
  NOW(),
  NOW()
);
```

## Next Steps

1. Check server terminal for specific error messages
2. Try the simple test page first
3. If that works, the issue is with the specific page component
4. If that doesn't work, there's a deeper routing/server issue
