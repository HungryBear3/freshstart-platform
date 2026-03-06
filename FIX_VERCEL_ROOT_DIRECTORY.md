# Fix Vercel Root Directory Issue

## The Problem
Vercel says: "The specified Root Directory 'newstart-il' does not exist"

## The Solution

You have two options:

### Option 1: Merge to Main Branch (Recommended)

Your code is on the `update-tasks` branch, but Vercel might be looking at `main`. 

**Merge to main:**
```bash
cd "C:\Users\alkap\.cursor\FreshStart IL\ai-dev-tasks"
git checkout main
git merge update-tasks
git push origin main
```

Then in Vercel:
1. Go to **Settings** → **Git**
2. Make sure **Production Branch** is set to `main`
3. Set **Root Directory** to `newstart-il`
4. Redeploy

### Option 2: Configure Vercel to Use update-tasks Branch

1. Go to Vercel Dashboard → Your Project → **Settings**
2. Click **Git**
3. Set **Production Branch** to `update-tasks`
4. Go to **General**
5. Set **Root Directory** to `newstart-il`
6. Click **Save**
7. Go to **Deployments** → **Redeploy**

### Option 3: Check Branch in Vercel

1. Go to Vercel Dashboard → Your Project
2. Click **Settings** → **Git**
3. Check which branch is connected
4. Make sure it's the branch that has your code (`update-tasks` or `main`)

## Quick Fix Steps

1. **Check Vercel Git Settings:**
   - Dashboard → Project → **Settings** → **Git**
   - Note which branch is connected

2. **If branch is `main` but code is on `update-tasks`:**
   - Either merge to main (Option 1)
   - Or change Vercel to use `update-tasks` branch (Option 2)

3. **Set Root Directory:**
   - Settings → **General**
   - Root Directory: `newstart-il`
   - Save

4. **Redeploy:**
   - Deployments → Redeploy

## Verify

After fixing:
1. Check deployment logs
2. Should see files being found in `newstart-il/` folder
3. Build should succeed
4. App should load at your URL
