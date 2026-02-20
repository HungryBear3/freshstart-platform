# Troubleshooting Login Issues

## Common Issues and Solutions

### Issue 1: "Creating new account does not work"

**Possible Causes:**
1. Database connection issue
2. Prisma client not generated
3. Email already exists
4. Server not running

**Solutions:**

1. **Check Database Connection:**
   ```powershell
   # Verify DATABASE_URL in .env.local
   cd newstart-il
   Get-Content .env.local | Select-String "DATABASE_URL"
   ```

2. **Generate Prisma Client:**
   ```powershell
   npm run db:generate
   ```

3. **Check Server Logs:**
   - Look at the terminal where `npm run dev` is running
   - Look for Prisma errors or database connection errors

4. **Try Different Email:**
   - Use a unique email address
   - If email exists, try signing in instead

5. **Check Browser Console:**
   - Open DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for failed API calls

### Issue 2: "Signing in creates brackets"

**Possible Causes:**
1. NextAuth error message formatting
2. JSON parsing issue
3. Error object being displayed incorrectly

**Solutions:**

1. **Clear Browser Cache:**
   - Hard refresh: `Ctrl+Shift+R`
   - Or clear cookies for localhost

2. **Check Error Message:**
   - Look at the actual error text
   - Check browser console for full error

3. **Try Test User:**
   - Go to: `http://localhost:3002/admin/seed-test-user`
   - Click "Create Test User"
   - Use credentials: `test@example.com` / `test123456`

## Quick Fix Steps

1. **Restart Server:**
   ```powershell
   # Stop server (Ctrl+C)
   cd newstart-il
   npm run dev
   ```

2. **Clear Build Cache:**
   ```powershell
   cd newstart-il
   Remove-Item -Recurse -Force .next
   npm run dev
   ```

3. **Verify Database:**
   ```powershell
   cd newstart-il
   npm run db:generate
   npm run db:studio  # Opens Prisma Studio to view database
   ```

4. **Check Environment Variables:**
   ```powershell
   cd newstart-il
   Get-Content .env.local | Select-String "NEXTAUTH|DATABASE"
   ```

## Testing Steps

1. **Test Registration:**
   - Go to: `http://localhost:3002/auth/signup`
   - Use a unique email (e.g., `test2@example.com`)
   - Password: `test123456`
   - Check browser console for errors

2. **Test Sign In:**
   - Go to: `http://localhost:3002/auth/signin`
   - Use test credentials: `test@example.com` / `test123456`
   - Check for error messages

3. **Check API Directly:**
   - Open browser console (F12)
   - Network tab
   - Try registration/sign in
   - Check the API response

## If Still Not Working

Share:
1. **Error message** (exact text, including any brackets)
2. **Browser console errors** (F12 → Console tab)
3. **Server terminal output** (any error messages)
4. **Network tab** (failed API calls and their responses)

This will help identify the specific issue.
