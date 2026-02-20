-- Manual Database Setup SQL for NewStart IL
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- This creates all tables from the Prisma schema

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "password" TEXT,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    -- Marketing Attribution (captured on signup)
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmTerm" TEXT,
    "utmContent" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Accounts table (NextAuth.js)
CREATE TABLE IF NOT EXISTS "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- Sessions table (NextAuth.js)
CREATE TABLE IF NOT EXISTS "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- Verification tokens table (NextAuth.js)
CREATE TABLE IF NOT EXISTS "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("identifier", "token")
);

-- Questionnaire responses table
CREATE TABLE IF NOT EXISTS "questionnaire_responses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "formType" TEXT NOT NULL,
    "responses" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "questionnaire_responses_pkey" PRIMARY KEY ("id")
);

-- Documents table
CREATE TABLE IF NOT EXISTS "documents" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- Case info table
CREATE TABLE IF NOT EXISTS "case_info" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "caseNumber" TEXT,
    "courtName" TEXT,
    "county" TEXT,
    "judgeName" TEXT,
    "filingDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'not_filed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "case_info_pkey" PRIMARY KEY ("id")
);

-- Milestones table
CREATE TABLE IF NOT EXISTS "milestones" (
    "id" TEXT NOT NULL,
    "caseInfoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- Deadlines table
CREATE TABLE IF NOT EXISTS "deadlines" (
    "id" TEXT NOT NULL,
    "caseInfoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "reminderSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deadlines_pkey" PRIMARY KEY ("id")
);

-- Financial data table
CREATE TABLE IF NOT EXISTS "financial_data" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "income" JSONB,
    "expenses" JSONB,
    "assets" JSONB,
    "debts" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_data_pkey" PRIMARY KEY ("id")
);

-- Legal content table
CREATE TABLE IF NOT EXISTS "legal_content" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT[],
    "published" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_content_pkey" PRIMARY KEY ("id")
);

-- Form templates table
CREATE TABLE IF NOT EXISTS "form_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "filePath" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_templates_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");
CREATE UNIQUE INDEX IF NOT EXISTS "sessions_sessionToken_key" ON "sessions"("sessionToken");
CREATE UNIQUE INDEX IF NOT EXISTS "verification_tokens_token_key" ON "verification_tokens"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "legal_content_slug_key" ON "legal_content"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "case_info_userId_key" ON "case_info"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "financial_data_userId_key" ON "financial_data"("userId");

-- Create foreign key constraints
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "documents" ADD CONSTRAINT "documents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "case_info" ADD CONSTRAINT "case_info_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_caseInfoId_fkey" FOREIGN KEY ("caseInfoId") REFERENCES "case_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "deadlines" ADD CONSTRAINT "deadlines_caseInfoId_fkey" FOREIGN KEY ("caseInfoId") REFERENCES "case_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "financial_data" ADD CONSTRAINT "financial_data_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "accounts_userId_idx" ON "accounts"("userId");
CREATE INDEX IF NOT EXISTS "sessions_userId_idx" ON "sessions"("userId");
CREATE INDEX IF NOT EXISTS "questionnaire_responses_userId_idx" ON "questionnaire_responses"("userId");
CREATE INDEX IF NOT EXISTS "documents_userId_idx" ON "documents"("userId");
CREATE INDEX IF NOT EXISTS "milestones_caseInfoId_idx" ON "milestones"("caseInfoId");
CREATE INDEX IF NOT EXISTS "deadlines_caseInfoId_idx" ON "deadlines"("caseInfoId");

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database setup completed successfully! All tables have been created.';
END $$;
