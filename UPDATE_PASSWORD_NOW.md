# Update PostgreSQL Password - Quick Guide

## ✅ .env.local Already Updated!

Your `.env.local` file has been updated with the new password:
```
64cG6rtNbaUjyQSXm0MTSjdPEX7EvVEQCSQyZU6IR0E=
```

## 🔧 Now Update PostgreSQL Password

You have **2 easy options**:

### Option 1: Use pgAdmin (EASIEST - Recommended)

1. **Open pgAdmin** from Start Menu
2. **Connect to PostgreSQL server**
   - If it asks for password, try your current one or leave blank
3. **Navigate to**: Servers → Your Server → Login/Group Roles
4. **Right-click** on `postgres` → **Properties**
5. **Go to** "Definition" tab
6. **Enter new password**: `64cG6rtNbaUjyQSXm0MTSjdPEX7EvVEQCSQyZU6IR0E=`
7. **Click "Save"**

✅ Done! No typing passwords in terminal needed.

### Option 2: Use psql Command

**Important**: When you type the password, it will be HIDDEN (you won't see anything). This is normal for security!

Run this command:
```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "ALTER USER postgres WITH PASSWORD '64cG6rtNbaUjyQSXm0MTSjdPEX7EvVEQCSQyZU6IR0E=';"
```

When prompted for password:
- **Type your CURRENT PostgreSQL password** (it won't show on screen)
- **Press Enter**

## ✅ After Updating PostgreSQL

Test the connection:
```powershell
npm run db:test
```

You should see:
```
✅ All connection tests passed! Database is ready to use.
```

## 🎯 Recommended: Use pgAdmin

Since terminal password input is hidden, **pgAdmin is the easiest option**. You can see what you're typing and it's more user-friendly.

## 📋 Password to Use

```
64cG6rtNbaUjyQSXm0MTSjdPEX7EvVEQCSQyZU6IR0E=
```

This password is already in your `.env.local` file. Just update PostgreSQL to match it!
