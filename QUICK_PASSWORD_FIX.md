# Quick Password Fix Guide

## ✅ PostgreSQL 18 Found!

Your PostgreSQL installation is at: `C:\Program Files\PostgreSQL\18\`

## 🔧 Method 1: Use PowerShell Script (Easiest)

Run this command:

```powershell
.\scripts\change-postgres-password.ps1
```

The script will:
- ✅ Find psql automatically
- ✅ Prompt you for current password
- ✅ Change password to `Doctor4me`
- ✅ Test the connection

## 🔧 Method 2: Use psql Directly

Run this command (you'll be prompted for your CURRENT password):

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "ALTER USER postgres WITH PASSWORD 'Doctor4me';"
```

**Note**: You need to enter your CURRENT PostgreSQL password when prompted (not the new one).

## 🔧 Method 3: Use pgAdmin (GUI - No Command Line)

1. Open **pgAdmin** (usually in Start Menu)
2. Connect to your PostgreSQL server (enter current password)
3. Expand **Servers** → Your Server → **Login/Group Roles**
4. Right-click on **postgres** → **Properties**
5. Go to **Definition** tab
6. Enter new password: `Doctor4me`
7. Click **Save**

## 🔧 Method 4: Update .env.local Instead

If you know your current PostgreSQL password and want to keep it:

1. Open `.env.local`
2. Update the password in `DATABASE_URL`:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_CURRENT_PASSWORD@localhost:5432/newstart_il"
   ```

## ✅ After Changing Password

Test the connection:

```powershell
npm run db:test
```

You should see:
```
✅ All connection tests passed! Database is ready to use.
```

## 🆘 Don't Know Current Password?

### Reset PostgreSQL Password (Advanced)

1. **Stop PostgreSQL service**:
   ```powershell
   Stop-Service postgresql-x64-18
   ```

2. **Edit pg_hba.conf**:
   - Location: `C:\Program Files\PostgreSQL\18\data\pg_hba.conf`
   - Find: `host all all 127.0.0.1/32 md5`
   - Change to: `host all all 127.0.0.1/32 trust`
   - Save file

3. **Start PostgreSQL**:
   ```powershell
   Start-Service postgresql-x64-18
   ```

4. **Connect without password**:
   ```powershell
   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres
   ```

5. **Set new password**:
   ```sql
   ALTER USER postgres WITH PASSWORD 'Doctor4me';
   \q
   ```

6. **Revert pg_hba.conf** (change `trust` back to `md5`)

7. **Restart PostgreSQL**:
   ```powershell
   Restart-Service postgresql-x64-18
   ```

## 📝 Recommended: Use the PowerShell Script

The easiest way is to use the script I created:

```powershell
cd "C:\Users\alkap\.cursor\FreshStart IL\ai-dev-tasks\newstart-il"
.\scripts\change-postgres-password.ps1
```

It will guide you through the process!
