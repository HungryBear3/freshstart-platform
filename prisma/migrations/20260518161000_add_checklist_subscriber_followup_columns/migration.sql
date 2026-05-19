-- Align live ChecklistSubscriber table with prisma/schema.prisma.
-- Sentry showed checklistSubscriber.upsert failures; read-only schema check found
-- followupStep/followupSentAt missing from the live table while Prisma expects them.
ALTER TABLE IF EXISTS "ChecklistSubscriber"
  ADD COLUMN IF NOT EXISTS "followupStep" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "followupSentAt" TIMESTAMP(3);
