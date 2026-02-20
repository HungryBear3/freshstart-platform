# Environment Variables Setup

## Quick Fix for NextAuth Error

Your `.env.local` file is missing required NextAuth variables. Add these lines:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generated-secret-below>
```

## Steps to Fix

1. **Open `.env.local`** in the `newstart-il` folder

2. **Add these lines** (if they don't exist):
   ```env
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=<paste-generated-secret-here>
   ```

3. **Generate NEXTAUTH_SECRET** (run this command):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
   
   Or use PowerShell:
   ```powershell
   [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
   ```

4. **Copy the generated secret** and paste it as the value for `NEXTAUTH_SECRET`

5. **Save the file**

6. **Restart your dev server**:
   - Stop the current server (Ctrl+C)
   - Run: `npm run dev`

## Example .env.local

Your `.env.local` should look like this:

```env
DATABASE_URL="postgresql://postgres:Doctor4me@localhost:5432/newstart_il"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-generated-secret-here-64-characters-long
```

## Verify Setup

After adding the variables, run:
```bash
npx tsx scripts/check-env.ts
```

You should see all ✅ checkmarks.

## Why This Fixes the Error

The error "There was a problem with the server configuration" occurs because:
- NextAuth requires `NEXTAUTH_SECRET` to encrypt JWT tokens
- NextAuth requires `NEXTAUTH_URL` to generate callback URLs
- Without these, NextAuth cannot initialize properly
