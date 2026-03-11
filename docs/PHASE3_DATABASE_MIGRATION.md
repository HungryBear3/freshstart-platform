# Phase 3 Database Migration

Phase 3 adds `user_badges`, `case_invitations`, and `case_collaborators` tables for gamification and spouse collaboration.

## When to Run This

Run this migration in the **FreshStart IL** Supabase project (the one used by www.freshstart-il.com). If you previously ran it in a different project (e.g., overtaxed-platform), you must run it again in the FreshStart IL project.

## How to Verify Which Project You're In

1. Open **Supabase Dashboard** → select your project
2. Check the project URL or name — FreshStart IL uses a project with `users`, `case_info`, `questionnaires`, etc.
3. Run: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`
   - **FreshStart IL** has: `users`, `case_info`, `questionnaires`, `questionnaire_responses`, etc.
   - **Overtaxed** has: `User`, `Appeal`, `Property`, `Invoice`, etc.

## SQL to Run (Supabase SQL Editor)

### Step 1: Create tables (no foreign keys)

```sql
CREATE TABLE IF NOT EXISTS "user_badges" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "badgeId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_badges_userId_badgeId_key" ON "user_badges"("userId", "badgeId");
CREATE INDEX IF NOT EXISTS "user_badges_userId_idx" ON "user_badges"("userId");

CREATE TABLE IF NOT EXISTS "case_invitations" (
    "id" TEXT NOT NULL,
    "caseInfoId" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "inviteeEmail" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "case_invitations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "case_invitations_token_key" ON "case_invitations"("token");
CREATE INDEX IF NOT EXISTS "case_invitations_token_idx" ON "case_invitations"("token");
CREATE INDEX IF NOT EXISTS "case_invitations_inviteeEmail_status_idx" ON "case_invitations"("inviteeEmail", "status");

CREATE TABLE IF NOT EXISTS "case_collaborators" (
    "id" TEXT NOT NULL,
    "caseInfoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "case_collaborators_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "case_collaborators_caseInfoId_userId_key" ON "case_collaborators"("caseInfoId", "userId");
CREATE INDEX IF NOT EXISTS "case_collaborators_userId_idx" ON "case_collaborators"("userId");
```

### Step 2: Add foreign keys (only if referenced tables exist)

**If your `users` table is lowercase:**
```sql
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "case_invitations" ADD CONSTRAINT "case_invitations_caseInfoId_fkey" 
    FOREIGN KEY ("caseInfoId") REFERENCES "case_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "case_collaborators" ADD CONSTRAINT "case_collaborators_caseInfoId_fkey" 
    FOREIGN KEY ("caseInfoId") REFERENCES "case_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

**If your `User` table is capitalized (e.g., overtaxed schema):**
```sql
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- Skip case_invitations and case_collaborators FKs if case_info doesn't exist
```

## Verification

After running, verify:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('user_badges', 'case_invitations', 'case_collaborators');
```
Should return 3 rows.
