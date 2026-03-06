# How to Update Existing Environment Variables in Vercel

## Problem
You're seeing: "A variable with the name `NEXTAUTH_URL` already exists"

This means the variable is already set, but you need to **update** it with your new domain.

## Solution: Update Existing Variable

### Step 1: Access Environment Variables
1. Go to **Vercel Dashboard** → Your Project
2. Click **Settings** (gear icon)
3. Click **Environment Variables** (in left sidebar)

### Step 2: Find and Edit the Variable
1. You'll see a list of all environment variables
2. Find `NEXTAUTH_URL` in the list
3. Click the **three dots (⋯)** or **Edit** button next to it
4. Click **Edit** from the dropdown

### Step 3: Update the Value
1. In the edit dialog, you'll see:
   - **Key:** `NEXTAUTH_URL` (don't change this)
   - **Value:** Current value (e.g., `https://your-app-name.vercel.app`)
2. **Update the Value** to your custom domain:
   ```
   https://yourdomain.com
   ```
   **Important:**
   - Use `https://` (not `http://`)
   - No trailing slash (not `https://yourdomain.com/`)
   - Use your actual domain name

3. **Check Environment Scopes:**
   - Make sure it's checked for **Production** (and Preview/Development if needed)
   - You can select multiple environments

4. Click **Save**

### Step 4: Redeploy
After updating the variable:
1. Go to **Deployments** tab
2. Click the **three dots (⋯)** on the latest deployment
3. Click **Redeploy**
   - OR Vercel will auto-redeploy on your next git push

## Alternative: Delete and Re-add (Not Recommended)

If you can't edit the variable:
1. **Delete** the existing `NEXTAUTH_URL` variable
2. **Add** a new one with the same name and updated value

**Note:** This is usually unnecessary - editing is preferred.

## Verify the Update

1. **Check the Variable:**
   - Go back to Environment Variables
   - Verify `NEXTAUTH_URL` shows your new domain

2. **Test Your Site:**
   - Visit `https://yourdomain.com`
   - Try signing in/signing up
   - Verify redirects work correctly

3. **Check Vercel Logs:**
   - If authentication isn't working, check logs for errors
   - Go to **Deployments** → Click a deployment → **Logs**

## Common Issues

### Variable Not Updating
- **Solution:** Make sure you clicked **Save** after editing
- Redeploy after updating variables

### Wrong Environment Scope
- **Problem:** Variable updated but only for Development, not Production
- **Solution:** When editing, make sure **Production** is checked
- You can have different values for different environments

### Still Using Old Domain
- **Problem:** Site still redirects to old vercel.app domain
- **Solutions:**
  1. Clear browser cache and cookies
  2. Verify variable is set for Production environment
  3. Check that you redeployed after updating
  4. Wait a few minutes for changes to propagate

## Quick Checklist

- [ ] Found `NEXTAUTH_URL` in Environment Variables list
- [ ] Clicked Edit (three dots menu)
- [ ] Updated value to `https://yourdomain.com` (no trailing slash)
- [ ] Verified Production environment is checked
- [ ] Clicked Save
- [ ] Redeployed (or wait for auto-redeploy)
- [ ] Tested authentication on your domain

## Other Variables to Update

While you're updating environment variables, also check:

- **ALLOWED_ORIGIN** (if used)
  - Update to: `https://yourdomain.com`
  
- **SMTP_FROM** (if using email)
  - Update to: `noreply@yourdomain.com` or your domain email

---

**Tip:** You can update multiple variables at once, then redeploy once to apply all changes.
