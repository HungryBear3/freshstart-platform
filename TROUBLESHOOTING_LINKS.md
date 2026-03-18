# Troubleshooting: Legal Article Links Not Working

## Quick Fixes (Try in Order)

### 1. Restart Your Development Server
If you're running locally, stop and restart the dev server:

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

### 2. Clear Next.js Cache
Clear the `.next` build cache:

```bash
# Delete the .next folder
rm -rf .next
# or on Windows:
Remove-Item -Recurse -Force .next

# Then restart:
npm run dev
```

### 3. Hard Refresh Your Browser
- **Chrome/Firefox/Edge**: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or clear browser cache

### 4. Check Browser Console
Open browser DevTools (F12) and check:
- **Console tab**: Look for JavaScript errors
- **Network tab**: Check if requests to `/legal-info/child-custody` are returning 404

### 5. If Deployed - Redeploy
If you're using Vercel, Netlify, or another platform:
- Push your changes to git
- Trigger a new deployment
- Or manually redeploy from the platform dashboard

### 6. Verify the Route Works
Test the route directly:
- Visit: `http://localhost:3000/legal-info/child-custody`
- Should show the child custody article content

### 7. Check for Build Errors
```bash
# Build the project to check for errors
npm run build
```

## What Was Fixed

The dynamic route at `app/legal-info/[slug]/page.tsx` now includes:
- Static fallback content for all 5 legal articles
- Works even if database isn't seeded
- Falls back gracefully if database query fails

## Test All Links

Verify these links work:
- `/legal-info/grounds-for-divorce`
- `/legal-info/property-division`
- `/legal-info/child-custody`
- `/legal-info/spousal-maintenance`
- `/legal-info/residency-requirements`

## Still Not Working?

If links still show 404 after trying above:
1. Check server logs for errors
2. Verify the file exists: `app/legal-info/[slug]/page.tsx`
3. Check Next.js version compatibility
4. Try accessing a working page first (like `/legal-info`) to ensure routing works
