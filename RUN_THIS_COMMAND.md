# Run This Command to Fix Database Password

## ✅ Quick Fix

**Copy and paste this command into your PowerShell terminal:**

```powershell
cd "C:\Users\alkap\.cursor\FreshStart IL\ai-dev-tasks\newstart-il"
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "ALTER USER postgres WITH PASSWORD 'Doctor4me';"
```

## 📝 What Will Happen

1. You'll be prompted: `Password for user postgres:`
2. **Enter your CURRENT PostgreSQL password** (the one that works now)
3. The password will be changed to `Doctor4me`
4. You should see: `ALTER ROLE`

## ✅ After Running

Test the connection:

```powershell
npm run db:test
```

You should see:
```
✅ All connection tests passed! Database is ready to use.
```

## 🆘 Don't Know Current Password?

### Option 1: Use pgAdmin (GUI)

1. Open **pgAdmin** from Start Menu
2. Connect to PostgreSQL server (try common passwords or leave blank)
3. Once connected:
   - Expand **Servers** → Your Server → **Login/Group Roles**
   - Right-click **postgres** → **Properties**
   - Go to **Definition** tab
   - Enter new password: `Doctor4me`
   - Click **Save**

### Option 2: Reset Password (Advanced)

If you can't remember the password, you can reset it by temporarily disabling password authentication:

1. **Stop PostgreSQL**:
   ```powershell
   Stop-Service postgresql-x64-18
   ```

2. **Edit pg_hba.conf**:
   - File: `C:\Program Files\PostgreSQL\18\data\pg_hba.conf`
   - Find: `host all all 127.0.0.1/32 md5`
   - Change to: `host all all 127.0.0.1/32 trust`
   - Save

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

### Option 3: Update .env.local Instead

If you know your current PostgreSQL password and want to keep it, just update `.env.local`:

```env
DATABASE_URL="postgresql://postgres:YOUR_CURRENT_PASSWORD@localhost:5432/newstart_il"
```

Then test:
```powershell
npm run db:test
```
