# Fix Database Password Authentication

## 🔍 Problem

The database connection is failing with: **"password authentication failed for user postgres"**

This means the password in your `.env.local` file doesn't match your PostgreSQL password.

## ✅ Solution Options

### Option 1: Update PostgreSQL Password (Recommended)

Change your PostgreSQL password to match what's in `.env.local`:

#### Using psql (Command Line):
```powershell
# Connect to PostgreSQL (you'll need the current password)
psql -U postgres

# Then run:
ALTER USER postgres WITH PASSWORD 'Doctor4me';
\q
```

#### Using pgAdmin (GUI):
1. Open pgAdmin
2. Connect to your PostgreSQL server
3. Right-click on "Login/Group Roles" → "postgres"
4. Go to "Definition" tab
5. Enter new password: `Doctor4me`
6. Click "Save"

### Option 2: Update .env.local Password

Update your `.env.local` file to use the correct PostgreSQL password:

1. Find out your current PostgreSQL password
2. Update `.env.local`:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_ACTUAL_PASSWORD@localhost:5432/newstart_il"
   ```

### Option 3: Create a New Database User (Most Secure)

Create a dedicated user for your application:

```sql
-- Connect as postgres user first
CREATE USER newstart_app WITH PASSWORD 'secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE newstart_il TO newstart_app;
GRANT ALL ON SCHEMA public TO newstart_app;
```

Then update `.env.local`:
```env
DATABASE_URL="postgresql://newstart_app:secure_password_here@localhost:5432/newstart_il"
```

## 🔧 After Fixing

1. **Test the connection**:
   ```bash
   npm run db:test
   ```

2. **You should see**:
   ```
   ✅ All connection tests passed! Database is ready to use.
   ```

## 🆘 Can't Remember PostgreSQL Password?

### Reset PostgreSQL Password (Windows)

1. **Stop PostgreSQL service**:
   ```powershell
   Stop-Service postgresql-x64-XX  # Replace XX with your version
   ```

2. **Edit pg_hba.conf** (usually in `C:\Program Files\PostgreSQL\XX\data\`):
   - Find line: `host all all 127.0.0.1/32 md5`
   - Change to: `host all all 127.0.0.1/32 trust`
   - Save file

3. **Start PostgreSQL service**:
   ```powershell
   Start-Service postgresql-x64-XX
   ```

4. **Connect without password**:
   ```powershell
   psql -U postgres
   ```

5. **Set new password**:
   ```sql
   ALTER USER postgres WITH PASSWORD 'Doctor4me';
   ```

6. **Revert pg_hba.conf** (change `trust` back to `md5`)

7. **Restart PostgreSQL service**

## ✅ Quick Test

After fixing, run:
```bash
npm run db:test
```

Expected output:
```
✅ PostgreSQL connection successful!
✅ Prisma Client connection successful!
✅ Query successful!
✅ All connection tests passed!
```
