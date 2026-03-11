# Troubleshooting Guide

## NextAuth ClientFetchError: "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

This error occurs when NextAuth can't reach the API route. Here are solutions:

### 1. Check Environment Variables

Make sure `.env.local` has:
```env
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"
```

Generate a secret:
```bash
openssl rand -base64 32
```

### 2. Restart Development Server

After adding/changing environment variables:
1. Stop the dev server (Ctrl+C)
2. Start it again: `npm run dev`

### 3. Check API Route

Verify the route exists at: `app/api/auth/[...nextauth]/route.ts`

### 4. Clear Browser Cache

- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Or clear browser cache and cookies

### 5. Check Database Connection

If using Prisma, make sure:
- Database is connected
- Run: `npm run db:generate`
- Check `.env.local` has correct `DATABASE_URL`

### 6. Verify NextAuth Version

We're using NextAuth v5 beta. If issues persist, check:
```bash
npm list next-auth
```

Should show: `next-auth@5.0.0-beta.30`

### 7. Check Console for Errors

Open browser DevTools (F12) and check:
- Console tab for JavaScript errors
- Network tab to see if `/api/auth/session` is returning HTML instead of JSON

### 8. Try Direct API Access

Visit: `http://localhost:3000/api/auth/session`

Should return JSON, not HTML. If it returns HTML, the route isn't working.

## Common Issues

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3000
# Kill the process or use a different port
```

### Missing Dependencies
```bash
npm install
```

### TypeScript Errors
```bash
npm run type-check
```

### Build Errors
```bash
npm run build
```
