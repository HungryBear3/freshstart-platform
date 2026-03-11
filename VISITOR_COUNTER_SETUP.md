# Visitor Counter Setup Guide

## Overview

A visitor counter has been added to track and display the number of visitors to your site. It's privacy-friendly and uses session storage to avoid counting the same visitor multiple times in a single session.

## Features

- ✅ **Privacy-friendly**: No personal information stored
- ✅ **Session-based**: Counts each visitor once per session
- ✅ **Daily tracking**: Tracks visitors per day
- ✅ **Total count**: Shows cumulative visitor count
- ✅ **Today's count**: Optional display of today's visitors
- ✅ **Automatic**: Works automatically when visitors load the page

## Setup Steps

### 1. Run Database Migration

The visitor counter requires a new database table. Run the migration:

```bash
cd newstart-il
npm run db:migrate
```

Or if you prefer to push the schema directly:

```bash
npm run db:push
```

This will create the `visitor_counts` table in your database.

### 2. Verify the Migration

Check that the table was created:

```bash
npm run db:studio
```

In Prisma Studio, you should see a new `visitor_counts` table.

### 3. Deploy to Production

After running the migration locally, you'll need to run it in production:

**Option A: Using Vercel CLI**
```bash
vercel env pull .env.local
npx prisma migrate deploy
```

**Option B: Using Supabase SQL Editor**
- Go to Supabase Dashboard → SQL Editor
- Run the migration SQL manually (found in `prisma/migrations/`)

## Where It Appears

The visitor counter is displayed in two places:

1. **Homepage** (`/`) - Centered below the feature cards
2. **Footer** - In the left column, below the description

## Component Usage

You can add the visitor counter anywhere in your app:

```tsx
import { VisitorCounter } from "@/components/visitor-counter"

// Basic usage
<VisitorCounter />

// With today's count
<VisitorCounter showToday={true} />

// With custom styling
<VisitorCounter className="my-custom-class" />
```

## How It Works

1. **First Visit**: When a visitor loads a page with the counter:
   - Checks if they've been counted this session (using `sessionStorage`)
   - If not, increments the count via API
   - Stores a flag in `sessionStorage` to prevent duplicate counts

2. **Subsequent Visits**: 
   - If already counted this session, just displays the count
   - Doesn't increment again until a new session

3. **New Session**: 
   - When the browser session ends (tab closed), the flag is cleared
   - Next visit will count as a new visitor

## API Endpoints

### GET `/api/visitors`
Returns the current visitor count:
```json
{
  "total": 1234,
  "today": 45
}
```

### POST `/api/visitors`
Increments the visitor count for today:
```json
{
  "success": true,
  "total": 1235,
  "today": 46
}
```

## Privacy Considerations

- ✅ No personal information is stored
- ✅ No cookies are used (only sessionStorage)
- ✅ No IP addresses are logged
- ✅ No tracking across devices
- ✅ Session-based counting (resets when browser closes)

## Customization

### Change Display Format

Edit `components/visitor-counter.tsx` to customize:
- Text format
- Icons
- Styling
- Layout

### Change Counting Logic

Edit `app/api/visitors/route.ts` to:
- Add IP-based deduplication (if needed)
- Add time-based limits
- Add custom tracking logic

## Troubleshooting

### Counter Not Showing

1. **Check Database**: Ensure migration ran successfully
   ```bash
   npm run db:studio
   ```

2. **Check API**: Test the endpoint directly
   ```bash
   curl http://localhost:3000/api/visitors
   ```

3. **Check Console**: Look for errors in browser console

### Count Not Incrementing

1. **Check Session Storage**: Open DevTools → Application → Session Storage
   - Look for `visitor_tracked` key
   - Clear it to test counting again

2. **Check API Logs**: Look for errors in Vercel logs

3. **Check Database**: Verify records are being created
   ```bash
   npm run db:studio
   ```

### Migration Fails

If the migration fails:

1. **Check Prisma Schema**: Ensure `VisitorCount` model is correct
2. **Reset Database** (development only):
   ```bash
   npm run db:reset
   ```
3. **Manual Migration**: Use `db:push` instead:
   ```bash
   npm run db:push
   ```

## Database Schema

The visitor counter uses this Prisma model:

```prisma
model VisitorCount {
  id        String   @id @default(cuid())
  date      DateTime @default(now()) @db.Date
  count     Int      @default(1)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([date])
  @@map("visitor_counts")
}
```

## Performance

- **Lightweight**: Minimal database queries
- **Efficient**: Uses upsert to avoid race conditions
- **Scalable**: Can handle high traffic
- **Cached**: Uses sessionStorage to reduce API calls

## Future Enhancements

Possible improvements:
- [ ] Add analytics dashboard
- [ ] Track unique visitors vs. page views
- [ ] Add time-based analytics (hourly, weekly, monthly)
- [ ] Add geographic tracking (optional, with consent)
- [ ] Add referrer tracking
- [ ] Export analytics data

---

**Note**: The visitor counter is designed to be privacy-friendly and GDPR-compliant. It doesn't store any personal information and uses session-based counting only.
