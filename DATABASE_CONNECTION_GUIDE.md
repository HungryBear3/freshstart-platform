# Database Connection Guide

## ✅ Connection Status

Your database connection is **working correctly**!

### Current Setup
- **Database Type**: PostgreSQL (Local)
- **Database Name**: `newstart_il`
- **Host**: `localhost:5432`
- **User**: `postgres`
- **Tables**: 18 tables created and ready

### Verified Tables
- ✅ users
- ✅ accounts
- ✅ sessions
- ✅ verification_tokens
- ✅ questionnaires
- ✅ questionnaire_responses
- ✅ documents
- ✅ case_info
- ✅ milestones
- ✅ deadlines
- ✅ financial_data
- ✅ income_sources
- ✅ expenses
- ✅ assets
- ✅ debts
- ✅ legal_content
- ✅ form_templates
- ✅ _prisma_migrations

## Testing Connection

### Quick Test
```bash
npm run db:test
```

This will:
1. ✅ Test PostgreSQL connection
2. ✅ Test Prisma Client connection
3. ✅ Run a sample query
4. ✅ List all database tables

### View Database in Browser
```bash
npm run db:studio
```
Opens Prisma Studio at http://localhost:5555

## For Integration Tests

Integration tests need the `DATABASE_URL` environment variable. You can:

### Option 1: Use .env.local (Recommended)
Your `.env.local` file already has the connection string, and it's automatically loaded.

### Option 2: Set Environment Variable
```powershell
# PowerShell
$env:DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/newstart_il"
npm run test:integration
```

```bash
# Bash/Linux/Mac
export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/newstart_il"
npm run test:integration
```

### Option 3: Use Test Database (Recommended for CI/CD)
Create a separate test database:
```sql
CREATE DATABASE newstart_il_test;
```

Then set in `.env.local`:
```env
TEST_DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/newstart_il_test"
```

## Troubleshooting

### Connection Refused
- Make sure PostgreSQL is running
- Check the port (default: 5432)
- Verify firewall settings

### Authentication Failed
- Verify the password in `.env.local`
- Check PostgreSQL user permissions

### Tables Not Found
Run migrations:
```bash
npm run db:migrate
npm run db:generate
```

### SSL/TLS Errors
For local databases, SSL is usually not required. If you see SSL errors:
- Check your connection string doesn't have `?sslmode=require`
- For Supabase/cloud databases, SSL is required

## Switching to Supabase

If you want to use Supabase instead of local PostgreSQL:

1. **Get Connection String from Supabase**
   - Go to Supabase Dashboard → Settings → Database
   - Copy the "Connection string" (URI format)

2. **Update .env.local**
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres?sslmode=require"
   ```

3. **Test Connection**
   ```bash
   npm run db:test
   ```

4. **Run Migrations** (if needed)
   ```bash
   npm run db:push
   ```

## Next Steps

✅ Database connection is working
✅ All tables are created
✅ Ready for development

You can now:
- Run integration tests: `npm run test:integration`
- Start the dev server: `npm run dev`
- View database: `npm run db:studio`
