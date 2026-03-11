# Database Setup Scripts

## Initial Setup (First Time)

1. **Set up your database** (see DATABASE_SETUP.md)
2. **Update `.env.local`** with your DATABASE_URL
3. **Run migrations:**
   ```bash
   npx prisma migrate dev --name init
   ```
4. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

## Development Workflow

After making changes to `prisma/schema.prisma`:

1. **Create a migration:**
   ```bash
   npx prisma migrate dev --name describe_your_changes
   ```

2. **Generate Prisma Client:**
   ```bash
   npx prisma generate
   ```

## View Database in Browser

```bash
npx prisma studio
```

This opens a visual database browser at http://localhost:5555

## Reset Database (⚠️ Deletes all data)

```bash
npx prisma migrate reset
```
