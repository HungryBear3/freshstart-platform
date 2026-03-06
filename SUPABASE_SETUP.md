# Supabase Setup Steps

## Step 1: Create a New Project in Supabase

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - **Name**: `newstart-il` (or any name you prefer)
   - **Database Password**: Create a strong password (SAVE THIS - you'll need it!)
   - **Region**: Choose closest to you (e.g., `US East (N. Virginia)`)
4. Click "Create new project"
5. Wait 2-3 minutes for the project to be created

## Step 2: Get Your Connection String

1. In your Supabase project dashboard, go to **Settings** (gear icon) → **Database**
2. Scroll down to **Connection string** section
3. Select **URI** tab
4. Copy the connection string (it looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with the password you created in Step 1

## Step 3: Set Up Environment Variables

1. In your project root (`newstart-il` folder), create a file named `.env.local`
2. Add the following (replace with your actual values):

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret-here"
```

### Generate NEXTAUTH_SECRET

Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```

Or use an online generator: https://generate-secret.vercel.app/32

## Step 4: Run Database Migrations

Once your `.env.local` is set up, run:

```bash
cd newstart-il
npm run db:migrate
```

This will:
- Create all database tables
- Set up the schema

Then generate Prisma Client:

```bash
npm run db:generate
```

## Step 5: Verify Setup

Open Prisma Studio to see your database:

```bash
npm run db:studio
```

This opens a browser at http://localhost:5555 where you can view your database tables.

## Troubleshooting

- **Connection refused**: Make sure you replaced `[YOUR-PASSWORD]` in the connection string
- **Migration fails**: Check that your DATABASE_URL is correct in `.env.local`
- **Can't find .env.local**: Make sure you're in the `newstart-il` directory
