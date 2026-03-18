# Add Sentry to Vercel (FreshStart IL)

## Step 1: Create a Sentry project

1. Go to **https://sentry.io** and sign in (or create a free account).
2. Click **Create Project** (or **Add Project**).
3. Select **Next.js** as the platform.
4. Name the project (e.g. `freshstart-il`).
5. Click **Create Project**.
6. On the setup page, copy your **DSN**. It looks like:
   ```
   https://xxxxxxxx@xxxxx.ingest.sentry.io/xxxxx
   ```
   Keep this tab open—you’ll need it for Vercel.

## Step 2: Add environment variables in Vercel

1. Go to **https://vercel.com** and open your **FreshStart Platform** project.
2. Go to **Settings** → **Environment Variables**.
3. Add these two variables:

| Name | Value | Environment |
|------|-------|-------------|
| `SENTRY_DSN` | `https://xxx@xxx.ingest.sentry.io/xxx` (your DSN) | Production, Preview, Development |
| `NEXT_PUBLIC_SENTRY_DSN` | Same DSN as above | Production, Preview, Development |

4. For each variable:
   - Click **Add New**
   - Enter the **Name**
   - Paste your **Value** (the DSN from Sentry)
   - Select **Production**, **Preview**, and **Development** (or at least Production)
   - Click **Save**

## Step 3: Redeploy

1. Go to **Deployments** in your Vercel project.
2. Click the **⋯** menu on the latest deployment.
3. Click **Redeploy**.
4. Or push a new commit to trigger a fresh deploy.

## Step 4: Verify

1. Visit your live site (e.g. https://www.freshstart-il.com).
2. In Sentry, go to **Issues**.
3. Trigger a test error (e.g. visit a non-existent page or cause a client error).
4. You should see the error appear in Sentry within a few minutes.

## Optional: Source maps (readable stack traces)

For readable stack traces in Sentry:

1. In Sentry: **Settings** → **Projects** → your project → **Client Keys (DSN)**.
2. Note your **Organization slug** and **Project slug**.
3. In Sentry: **Settings** → **Auth Tokens** → **Create New Token**.
   - Scopes: `project:releases`, `org:read`.
   - Copy the token (starts with `sntrys_`).
4. In Vercel, add these environment variables:

| Name | Value |
|------|-------|
| `SENTRY_ORG` | Your Sentry org slug |
| `SENTRY_PROJECT` | Your Sentry project slug |
| `SENTRY_AUTH_TOKEN` | Your auth token (`sntrys_...`) |

5. Redeploy. Sentry will upload source maps during the build.

---

**Quick checklist**

- [ ] Sentry account created
- [ ] Next.js project created in Sentry
- [ ] DSN copied
- [ ] `SENTRY_DSN` added in Vercel
- [ ] `NEXT_PUBLIC_SENTRY_DSN` added in Vercel
- [ ] Redeployed
- [ ] Test error appears in Sentry
