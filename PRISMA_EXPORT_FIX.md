# Prisma Export Fix

## Issue
Turbopack warning about `export * from '@prisma/client'` causing CommonJS/ESM compatibility issues.

## Fix Applied
Removed the wildcard export from `lib/db/index.ts`:
- **Before**: `export * from '@prisma/client'`
- **After**: Removed (only export `prisma` instance)

## Why This Works
- We only need to export the `prisma` instance
- Prisma types can be imported directly from `@prisma/client` when needed
- This avoids the CommonJS/ESM compatibility warning

## Impact
- All existing imports of `prisma` from `@/lib/db` still work
- If you need Prisma types, import them directly:
  ```typescript
  import type { User, Document } from '@prisma/client'
  ```

## JSON Error Fix
Also improved error handling in registration route to:
- Always return JSON (never HTML)
- Better database error handling
- Clearer error messages
