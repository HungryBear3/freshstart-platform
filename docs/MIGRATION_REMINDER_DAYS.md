# Migration: Add reminderDaysBefore

Adds configurable reminder timing for deadline emails (3, 7, or 14 days before due date).

## SQL (Supabase SQL Editor)

Run in the FreshStart IL Supabase project SQL Editor. Use **Option A** if the table doesn't exist yet, or **Option B** if it already exists.

### Option A: Create table (if `user_notification_preferences` does not exist)

```sql
-- Create the table with all columns
CREATE TABLE IF NOT EXISTS "user_notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deadlineReminders" BOOLEAN NOT NULL DEFAULT true,
    "reminderDaysBefore" INTEGER NOT NULL DEFAULT 7,
    "marketingEmails" BOOLEAN NOT NULL DEFAULT false,
    "documentNotifications" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_notification_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_notification_preferences_userId_key" ON "user_notification_preferences"("userId");

ALTER TABLE "user_notification_preferences"
    ADD CONSTRAINT "user_notification_preferences_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

### Option B: Add column only (if table already exists)

```sql
ALTER TABLE "user_notification_preferences" ADD COLUMN IF NOT EXISTS "reminderDaysBefore" INTEGER NOT NULL DEFAULT 7;
```

### Enable RLS

Run this in the Supabase SQL Editor to enable Row Level Security on `user_notification_preferences`.

The policy names `service_role` explicitly. Omitting the `TO` clause would store the policy as a grant to **PUBLIC**, which on a Supabase project includes the unauthenticated `anon` role — that would open the table to unauthenticated read and write through the Data API, not restrict it.

```sql
ALTER TABLE "user_notification_preferences" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS service_role_full_user_notification_preferences
  ON "user_notification_preferences";

CREATE POLICY service_role_full_user_notification_preferences
ON "user_notification_preferences"
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

Note: the application reaches this table through Prisma on the Postgres **owner** connection, and a table owner bypasses RLS unless `FORCE ROW LEVEL SECURITY` is set. Enabling RLS here restricts the Supabase Data API; it does not scope application traffic. See `prisma/RLS_SETUP_GUIDE.md`.
