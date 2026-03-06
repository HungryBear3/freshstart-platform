# Favicon Troubleshooting for FreshStart IL

If the wrong favicon still shows on www.freshstart-il.com after pushing favicon fixes:

## 0. Verify Which App Is Live

1. Visit **https://www.freshstart-il.com/api/deploy-info**
2. You should see: `{"app":"newstart-il","project":"FreshStart IL","favicon":"base64-in-metadata",...}`
3. If you get **404** or different content → the domain may be pointing to a different project (e.g. overtaxed-platform).

## 1. Verify Vercel Project Configuration

**Critical:** The domain must point to the correct project.

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Find the project that has **www.freshstart-il.com** in its Domains
3. **Root Directory** (where to find it):
   - **Settings** → **General** → scroll to **Build & Development Settings** (or **Root Directory**)
   - Or: **Settings** → look for **Root Directory** with an "Edit" button
   - It must be `newstart-il` (not empty, not `.`, not `overtaxed-platform`)
4. **Git Repository**: Must be `HungryBear3/FreshStart-IL`
5. **Production Branch**: Must be `main`

If Root Directory is wrong, our favicon changes never reach production.

## 2. Clear Build Cache and Redeploy

1. Vercel Dashboard → Your FreshStart project
2. **Deployments** tab → click the **...** menu on the latest deployment
3. **Redeploy** → enable **"Clear build cache"** → Redeploy

Or: **Settings** → **Git** → **Redeploy** with "Clear build cache" if available.

## 3. Purge CDN Cache (if HTML is still stale)

After a successful redeploy, if the old favicon persists:

1. Vercel Dashboard → Project → **Settings** → **Functions** or **Caching**
2. Use **Purge Cache** if available
3. Or run: `vercel cache purge --type=cdn` (requires Vercel CLI)

## 4. Verify in Browser

1. Open www.freshstart-il.com in an **Incognito/Private** window
2. Right-click → **View Page Source**
3. Search for `favicon` or `rel="icon"`
4. You should see: `<link rel="icon" href="data:image/png;base64,iVBORw0KGgo...` (long base64 string)
5. You should **NOT** see: `href="/favicon.ico?favicon.` (that was the old bug)

## 5. If Domain Points to Wrong Repo

If your production deploys from a **different** repo (e.g. `HungryBear3/freshstart-platform`):

- Either: Point the Vercel project to `HungryBear3/FreshStart-IL` with Root Directory `newstart-il`
- Or: Push the favicon fix to that other repo (copy `app/layout.tsx`, `lib/favicon-base64.ts`)
