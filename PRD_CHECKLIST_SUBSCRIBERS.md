# PRD: Fresh Start IL — Checklist Subscriber Storage

## Goal
When someone submits their email on the checklist form, save them to the database so we can build a lead list and follow up later.

## Working Directory
`/private/tmp/fs-subscribers` (freshstart-platform, branch feat/checklist-subscribers)

## Tasks

### 1. Add `ChecklistSubscriber` model to Prisma schema
File: `prisma/schema.prisma`

Add this model at the end of the file:
```prisma
model ChecklistSubscriber {
  id          String   @id @default(cuid())
  email       String   @unique
  createdAt   DateTime @default(now())
  source      String?  // e.g. "homepage", "checklist-page"
  utmSource   String?
  utmMedium   String?
  utmCampaign String?
}
```

### 2. Create and run migration
Run: `npx prisma migrate dev --name add_checklist_subscribers`

### 3. Update checklist API to save subscriber
File: `app/api/checklist/route.ts`

After `sendChecklistEmail(email)` succeeds, add a DB upsert:
```typescript
// Save subscriber (upsert so re-submissions don't error)
await prisma.upsert({
  where: { email },
  update: {}, // don't overwrite existing record
  create: {
    email,
    source: request.headers.get('referer')?.includes('/checklist') ? 'checklist-page' : 'homepage',
  },
}).catch(err => console.error('[Checklist] Failed to save subscriber:', err))
// Don't fail the request if DB save fails — email delivery is the primary job
```

Import prisma at top if not already imported:
```typescript
import { prisma } from "@/lib/db"
```

The model is `prisma.checklistSubscriber` (camelCase of ChecklistSubscriber).

### 4. Expose subscriber count in admin
File: `app/admin/marketing-links/page.tsx` (or create `app/admin/subscribers/page.tsx`)

Create `app/admin/subscribers/page.tsx`:
- Require admin auth (use pattern from other admin pages)
- Show total subscriber count
- Show a table of subscribers: email, source, createdAt (most recent first)
- Show last 100 subscribers paginated or all if under 100
- Add to admin nav if there is one

### 5. Build and verify
Run: `npm run build`
Fix any TypeScript errors.

## Constraints
- Use existing Prisma + shadcn/ui patterns already in the project
- Do not add new npm dependencies
- The checklist email must still send even if DB save fails (don't block on it)
- Use `@unique` on email so duplicate submissions are silently handled

## Completion
When `npm run build` succeeds:
1. Commit: `feat: save checklist subscribers to DB + admin view`
2. Push: `git push -u origin feat/checklist-subscribers`
3. Run: `openclaw system event --text "Done: FS checklist subscriber storage built and pushed" --mode now`
