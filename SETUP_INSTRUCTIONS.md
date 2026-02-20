# Database Setup Instructions

## Quick Setup via Supabase SQL Editor

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Setup Script**
   - Open the file: `prisma/manual_setup.sql`
   - Copy ALL the SQL code
   - Paste it into the SQL Editor
   - Click "Run" (or press Ctrl+Enter)

4. **Verify Setup**
   - You should see a success message
   - Go to "Table Editor" in the left sidebar
   - You should see all the tables created:
     - users
     - accounts
     - sessions
     - verification_tokens
     - questionnaire_responses
     - documents
     - case_info
     - milestones
     - deadlines
     - financial_data
     - legal_content
     - form_templates

5. **Generate Prisma Client**
   - After tables are created, run:
   ```bash
   npm run db:generate
   ```

## What This Creates

- ✅ All database tables from your Prisma schema
- ✅ All indexes for performance
- ✅ All foreign key relationships
- ✅ All unique constraints

## Next Steps

Once the database is set up:
1. Generate Prisma Client: `npm run db:generate`
2. Test connection: `npm run db:studio` (opens database browser)
3. Continue with development!
