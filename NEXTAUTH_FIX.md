# NextAuth ClientFetchError Fix

## The Error
```
Console ClientFetchError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

This error means NextAuth is receiving HTML (likely a 404 page) instead of JSON from the API route.

## Fixes Applied

1. **Removed explicit `basePath` from SessionProvider**
   - NextAuth v5 automatically detects the base path
   - Explicitly setting it can cause routing issues

2. **Verify the route exists**
   - Route should be at: `app/api/auth/[...nextauth]/route.ts`
   - Should export `GET` and `POST` handlers

## Additional Steps to Try

### 1. Restart the Development Server
```bash
# Stop the server (Ctrl+C)
# Then restart:
cd newstart-il
npm run dev
```

### 2. Check Environment Variables
Make sure `.env.local` has:
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
```

Generate a secret if needed:
```bash
openssl rand -base64 32
```

### 3. Clear Browser Cache
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or clear browser cache and cookies for localhost

### 4. Test the API Route Directly
Visit in browser: `http://localhost:3000/api/auth/session`

Should return JSON like:
```json
{}
```
or
```json
{"user": {...}}
```

If it returns HTML, the route isn't working.

### 5. Check for Build Errors
```bash
npm run build
```

### 6. Verify NextAuth Version
```bash
npm list next-auth
```
Should show: `next-auth@5.0.0-beta.30`

### 7. Check Console Network Tab
- Open DevTools (F12)
- Go to Network tab
- Look for `/api/auth/session` request
- Check if it's returning HTML (status 404) instead of JSON

## Common Causes

1. **Server not running** - Make sure `npm run dev` is running
2. **Wrong port** - Verify server is on port 3000
3. **Route not found** - Check that `app/api/auth/[...nextauth]/route.ts` exists
4. **Environment variables missing** - Check `.env.local`
5. **Build cache issues** - Try deleting `.next` folder and restarting

## If Still Not Working

1. Delete `.next` folder:
   ```bash
   rm -rf .next
   # or on Windows:
   rmdir /s .next
   ```

2. Reinstall dependencies:
   ```bash
   rm -rf node_modules
   npm install
   ```

3. Regenerate Prisma Client:
   ```bash
   npm run db:generate
   ```

4. Restart the dev server
