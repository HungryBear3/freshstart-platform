# Fix: 404 on /api/deploy-info = Wrong Vercel Configuration

The 404 on `/api/deploy-info` means **www.freshstart-il.com is NOT serving our newstart-il app**. Our fixes never reach production.

## Step 1: Check Which Repo Vercel Uses

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click the project that has **www.freshstart-il.com**
3. **Settings** tab → **Git** section
4. Note the **Connected Git Repository** (e.g. `HungryBear3/FreshStart-IL` or `HungryBear3/freshstart-platform`)

## Step 2: Fix Based on Repo

### If connected to `HungryBear3/FreshStart-IL` (monorepo)

**You must set Root Directory to `newstart-il`.**

Where to find it:
- **Settings** → **General** → scroll down
- Look for **"Root Directory"** or **"Build & Development Settings"**
- Click **Edit** next to Root Directory
- Enter: `newstart-il` (no slash at start/end)
- Save

If you truly don't see it: Vercel may have moved it. Try:
- **Settings** → **Build** (or **Build & Output**)
- Or when you first imported, it was in the import wizard

**Alternative: Re-create the project with correct root**

1. Create a **new** Vercel project
2. Import `HungryBear3/FreshStart-IL`
3. **During import**, when it asks for configuration, set **Root Directory** to `newstart-il`
4. Add your env vars (copy from old project)
5. Deploy
6. Add domain www.freshstart-il.com to this new project
7. Remove domain from old project (or delete old project)

### If connected to `HungryBear3/freshstart-platform` (separate repo)

Our pushes go to **FreshStart-IL**, not freshstart-platform. You need to sync newstart-il code to freshstart-platform.

**Option A – Push from local (run in repo root):**
```powershell
cd "C:\Users\alkap\.cursor\FreshStart IL\ai-dev-tasks"
git subtree split --prefix=newstart-il -b newstart-export
git push https://github.com/HungryBear3/freshstart-platform.git newstart-export:main
```

**Option B – Change Vercel to use FreshStart-IL instead**

1. Vercel project → **Settings** → **Git**
2. **Disconnect** the current repository
3. **Connect** to `HungryBear3/FreshStart-IL`
4. When prompted, set **Root Directory** to `newstart-il`
5. Redeploy

## Step 3: Verify

After fixing, redeploy (with Clear Build Cache). Then:

1. Visit https://www.freshstart-il.com/api/deploy-info
   - Should see: `{"app":"newstart-il","project":"FreshStart IL",...}`
2. View page source on homepage, search for `favicon`
   - Should see: `href="data:image/png;base64,iVBORw0KGgo...`
