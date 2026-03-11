# Database Setup Guide

## Option 1: Supabase (Recommended for MVP)

1. Go to https://supabase.com and sign up for a free account
2. Create a new project
3. Go to Project Settings → Database
4. Copy the "Connection string" (URI format)
5. Update your `.env.local` file with:
   ```
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
   ```

## Option 2: Neon (Serverless PostgreSQL)

1. Go to https://neon.tech and sign up
2. Create a new project
3. Copy the connection string
4. Update your `.env.local` file

## Option 3: Local PostgreSQL

1. Download and install PostgreSQL from https://www.postgresql.org/download/windows/
2. During installation, remember your password
3. Create a database:
   ```sql
   CREATE DATABASE newstart_il;
   ```
4. Update your `.env.local` file:
   ```
   DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/newstart_il"
   ```

## After Setting Up Database

Once you have your DATABASE_URL, run:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

This will:
- Create all database tables
- Generate Prisma Client for use in your code
