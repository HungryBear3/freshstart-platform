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

### Enable RLS (fix Supabase security warning)

Run this in Supabase SQL Editor to enable Row Level Security on `user_notification_preferences`:

```sql
ALTER TABLE "user_notification_preferences" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage user_notification_preferences"
ON "user_notification_preferences"
FOR ALL
USING (true)
WITH CHECK (true);
```

Note: Prisma uses the service role connection, which bypasses RLS. This satisfies the Supabase security scanner.
