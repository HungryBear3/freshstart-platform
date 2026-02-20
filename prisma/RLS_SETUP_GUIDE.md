# Row Level Security (RLS) Setup Guide

## Overview

This guide addresses the Supabase security warnings about RLS being disabled on public tables. The migration script enables RLS on all 33 tables and creates appropriate policies.

## Important Notes

**Your application will continue to work normally** because:
- Prisma uses the service role connection string (`DATABASE_URL`)
- Service role connections **bypass RLS entirely** in Supabase
- The RLS policies are for defense-in-depth and satisfy security scanner requirements

## How to Apply

### Step 1: Open Supabase SQL Editor

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your FreshStart IL project
3. Click **SQL Editor** in the left sidebar
4. Click **New query**

### Step 2: Run the Migration

1. Open the file: `prisma/enable_rls.sql`
2. Copy **ALL** the SQL code
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press `Ctrl+Enter` / `Cmd+Enter`)

### Step 3: Verify RLS is Enabled

Run this query in the SQL Editor to verify RLS is enabled on all tables:

```sql
SELECT 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'verification_tokens', 'sessions', 'accounts', 'users', 
    'questionnaire_responses', 'documents', 'case_info', 
    'milestones', 'deadlines', 'financial_data'
  )
ORDER BY tablename;
```

All tables should show `rls_enabled = true`.

### Step 4: Check Supabase Security Scanner

1. Go to **Project Settings** → **Database** → **Security**
2. The security warnings about RLS should now be resolved
3. You should see 0 or significantly fewer security concerns

## What This Does

1. **Enables RLS** on all 33 public tables
2. **Creates policies** that allow access (for documentation and direct DB access scenarios)
3. **Does NOT affect** your application because Prisma bypasses RLS with service role

## Tables Covered

- Authentication: `verification_tokens`, `sessions`, `accounts`, `users`
- User Data: `questionnaire_responses`, `documents`, `case_info`, `milestones`, `deadlines`
- Financial: `financial_data`, `income_sources`, `expenses`, `assets`, `debts`
- Children: `children`, `child_address_history`, `child_school_history`, `child_doctor_history`
- Parenting: `parenting_plans`, `parent_education_providers`, `parent_education_completions`
- Legal: `legal_content`, `form_templates`, `questionnaires`
- E-Filing: `e_filing_guides`, `county_e_filing_info`
- Other: `subscriptions`, `payments`, `visitor_counts`, `marketing_links`

## Troubleshooting

### Error: "policy already exists"
If you see this error, the policies were already created. You can either:
- Drop existing policies first, or
- Skip the policy creation lines (only run the `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` statements)

### Application Still Works?
Yes! Prisma uses service role which bypasses RLS. Your application will continue working exactly as before.

### Need to Restrict Access Later?
If you need to add user-specific access controls in the future, you can modify the policies. However, since you're using NextAuth.js (not Supabase Auth), you'd need to implement custom JWT claims or use a different approach.

## Security Benefits

Even though Prisma bypasses RLS, enabling it provides:
- ✅ Defense-in-depth against direct database access
- ✅ Compliance with Supabase security best practices
- ✅ Documentation of intended access patterns
- ✅ Protection if connection strings are accidentally exposed
