# Quick Start Testing Guide

## Step 1: Create a Test User Account

You have two options:

### Option A: Via Admin Page (Recommended)
1. Navigate to: `http://localhost:3000/admin/seed-test-user`
2. Click "Create Test User" button
3. You'll see the credentials displayed:
   - **Email:** test@example.com
   - **Password:** test123456

### Option B: Via Command Line
```bash
cd newstart-il
npm run seed:test-user
```

## Step 2: Sign In

1. Go to: `http://localhost:3000/auth/signin`
2. Enter credentials:
   - Email: `test@example.com`
   - Password: `test123456`
3. Click "Sign In"
4. You should be redirected to `/dashboard`

## Step 3: Seed Questionnaires

1. Navigate to: `http://localhost:3000/admin/seed-questionnaires`
2. Click "Seed Questionnaires" button
3. Wait for success message

## Step 4: Test Questionnaires

1. Go to: `http://localhost:3000/questionnaires`
2. You should see 3 questionnaires:
   - Petition for Dissolution of Marriage
   - Financial Affidavit (Short Form)
   - Parenting Plan
3. Click "Start" on any questionnaire
4. Fill out the form and test:
   - Conditional logic (answer "Yes" to "Do you have children?")
   - Auto-save (wait 2 seconds after typing)
   - Validation (try submitting with empty required fields)
   - Progress tracking (navigate between sections)

## Step 5: Generate Documents

1. Complete a questionnaire (fill all required fields and submit)
2. Go to: `http://localhost:3000/documents`
3. Find your completed questionnaire in "Ready to Generate Documents"
4. Click "Generate Document"
5. The document will be created (PDF generation pending templates)

## Alternative: Create Your Own Account

If you prefer to create your own account:

1. Go to: `http://localhost:3000/auth/signup`
2. Fill out the registration form
3. Note: Email verification is required, but for testing you can:
   - Check your email for verification link, OR
   - Use the test user account which is pre-verified

## Troubleshooting

### Sign In Link Not Working
- Make sure the dev server is running: `npm run dev`
- Try navigating directly: `http://localhost:3000/auth/signin`
- Check browser console for errors

### Can't Create Test User
- Make sure database is connected
- Check that Prisma client is generated: `npm run db:generate`
- Verify `.env.local` has correct `DATABASE_URL`

### Questionnaires Not Showing
- Make sure you seeded questionnaires: `/admin/seed-questionnaires`
- Check database: `npm run db:studio` and look at `questionnaires` table

## Test User Credentials Summary

- **Email:** test@example.com
- **Password:** test123456
- **Status:** Pre-verified (no email verification needed)
