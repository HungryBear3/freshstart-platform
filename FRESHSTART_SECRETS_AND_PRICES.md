# FreshStart IL: Base64 Secret, Encryption Key, Stripe Webhook Secret, and Price ID

Reference for **NEXTAUTH_SECRET**, **ENCRYPTION_KEY**, **STRIPE_WEBHOOK_SECRET**, and **ANNUAL_PRICE_ID** when deploying FreshStart IL (e.g. to Vercel).

---

## Security: never commit secrets

- **`.env.local`** is **gitignored** — it is **not** committed or pushed to GitHub. Store real secrets there locally.
- **This doc** uses **placeholders only** (`your-base64-secret`, `whsec_...`, `price_...`). Do **not** add real secret values to this file.
- **Production:** Store real values in **Vercel** → Project → **Settings** → **Environment Variables** (or your host’s env config). Never commit them.

**If you ever commit a secret:** Rotate it immediately (new NEXTAUTH_SECRET, new ENCRYPTION_KEY, new Stripe webhook secret, etc.). Consider making the repo **private** to limit who can see code and docs, but **never committing secrets** is what keeps you safe.

---

## 1. Base64 secret (NEXTAUTH_SECRET)

**Where to store it:** **`.env.local`** (local) and **Vercel** env vars (production). **Do not put the real value in this doc.**

**Generate one:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Or PowerShell:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Use the output as **NEXTAUTH_SECRET** in `.env.local` and in Vercel. Keep it secret.

---

## 2. Encryption key (ENCRYPTION_KEY)

**Where to store it:** **`.env.local`** (local) and **Vercel** env vars (production). **Do not put the real value in this doc.**

Used for encrypting sensitive data (e.g. in **lib/security/encryption.ts**). Generate a 32-byte hex key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Use the output as **ENCRYPTION_KEY** in `.env.local` and in Vercel. Keep it secret.

---

## 3. Stripe webhook secret (STRIPE_WEBHOOK_SECRET)

**Where to store it:** **`.env.local`** (local) and **Vercel** env vars (production). **Do not put the real value in this doc.**

### Local development

1. Install [Stripe CLI](https://stripe.com/docs/stripe-cli) (or `scoop install stripe`).
2. `stripe login`
3. `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
4. Copy the **Signing secret** (`whsec_...`) and set **STRIPE_WEBHOOK_SECRET** in `.env.local`.

### Vercel / production

1. [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks** → **Add endpoint**.
2. **Endpoint URL:** `https://<your-freshstart-vercel-url>/api/webhooks/stripe`
3. **Events:** `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`, `invoice.payment_failed`
4. **Add endpoint** → open it → **Reveal** **Signing secret** → copy `whsec_...`
5. **Vercel** → FreshStart project → **Settings** → **Environment Variables** → add **STRIPE_WEBHOOK_SECRET** = `whsec_...`
6. **Redeploy.**

Use **Test** vs **Live** mode endpoints and secrets as appropriate.

---

## 4. Stripe price ID (ANNUAL_PRICE_ID)

**Where to get it:** **Stripe Dashboard** → **Products** → your annual plan → **Pricing** → copy the **Price ID** (`price_...`). Or use the value in **`.env.local`** (gitignored).

**Env variable to set** (in `.env.local` and Vercel):

| Env variable | Placeholder | Notes |
|--------------|-------------|--------|
| `ANNUAL_PRICE_ID` | `price_...` | Annual subscription price |

Optional: **MONTHLY_PRICE_ID** if you offer a monthly plan.

Also set **NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY** and **STRIPE_SECRET_KEY** (from `.env.local` / Stripe) in Vercel.

---

## Quick checklist for Vercel

- [ ] **NEXTAUTH_SECRET** = base64 secret (from `node -e "..."` or `.env.local`)
- [ ] **ENCRYPTION_KEY** = 32-byte hex (from `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` or `.env.local`)
- [ ] **STRIPE_WEBHOOK_SECRET** = `whsec_...` from Stripe webhook for `https://<your-app>/api/webhooks/stripe`
- [ ] **ANNUAL_PRICE_ID** = `price_...`
- [ ] **DATABASE_URL** = Supabase pooler URL (port 6543)
- [ ] **NEXTAUTH_URL** = `https://<your-app>` (Vercel URL or custom domain)
- [ ] **NEXT_PUBLIC_APP_URL** = same as **NEXTAUTH_URL**
- [ ] **ALLOWED_ORIGIN** = same as **NEXTAUTH_URL** (often required for CORS)

Use **only** placeholders in this doc. Store real values in `.env.local` (local) and Vercel (production).
