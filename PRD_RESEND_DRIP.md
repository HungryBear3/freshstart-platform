# PRD: Fresh Start IL — Resend Drip Email Sequences

## Goal
Build automated drip email sequences for FreshStart IL using Resend. The Resend SDK and DripEmail Prisma model are already in place.

## Context
- `lib/resend.ts` — Resend client + FROM_EMAIL already created
- `lib/email.ts` — migrated to use Resend
- `prisma/schema.prisma` — DripEmail model already added (run migration if needed)
- RESEND_API_KEY is set in environment

## Working Directory
`/Users/abigailclaw/freshstart-platform` (branch: main)

## Tasks

### 1. Run Prisma migration (if not done)
```bash
npx prisma migrate dev --name add_drip_email
```

### 2. Create drip email API route
File: `app/api/drip/send/route.ts`

A cron-triggered route that:
- Queries DripEmail records where `scheduledFor <= now()` and `sentAt IS NULL`
- Sends each email via Resend
- Marks sentAt on success
- Handles errors gracefully (log, don't crash)

Protect with: check for `Authorization: Bearer ${process.env.CRON_SECRET}` header

### 3. Create drip enrollment utility
File: `lib/drip.ts`

Function `enrollInDrip(email: string, sequence: string)` that:
- Creates DripEmail records for each step in the sequence
- "fs-checklist" sequence: 5 emails at day 1, 3, 7, 14, 30
- Each step just records the scheduled time; content sent at send time

### 4. Enroll checklist subscribers automatically
In `app/api/checklist/subscribe/route.ts` (or wherever checklist subscribers are saved):
- After saving subscriber, call `enrollInDrip(email, "fs-checklist")`

### 5. Email content for fs-checklist sequence
Step 1 (immediate): "Your Illinois Divorce Checklist" — already exists as sendChecklistEmail in lib/email.ts, just trigger it
Step 2 (day 3): Subject: "The #1 mistake people make when filing for divorce in Illinois"
  Brief content about missing the Financial Affidavit notarization, plug FreshStart
Step 3 (day 7): Subject: "How much does divorce actually cost in Illinois?"
  Filing fees breakdown, cost of attorney vs DIY, plug FreshStart
Step 4 (day 14): Subject: "Is your spouse delaying your divorce? Here's what to do."
  Tips on keeping process moving, plug FreshStart
Step 5 (day 30): Subject: "Still thinking about it? Here's a free trial."
  Urgency + offer

### 6. Build and verify
Run: `npm run build`
Fix TypeScript errors.

## Constraints
- Use Resend SDK (already in lib/resend.ts)
- No new npm dependencies
- Don't break existing email functionality

## Completion
1. Commit: `feat: Resend drip email sequences for FS checklist`
2. Push: `git push origin main`
3. Run: `openclaw system event --text "Done: FS Resend drip sequences built" --mode now`
