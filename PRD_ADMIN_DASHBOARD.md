# PRD: Fresh Start IL — Admin Dashboard

## Goal
Build a proper admin dashboard for Fresh Start IL so Alexy can see signups, subscriptions, and revenue at a glance. Currently the admin folder has only seed/test pages.

## Working Directory
`/private/tmp/fs-admin` (freshstart-platform, branch feat/admin-dashboard)

## Tasks

### 1. Main Admin Dashboard Page
File: `app/admin/page.tsx`

Replace or create with a dashboard that shows:
- **Total users** (count from `prisma.user.count()`)
- **Active subscriptions** (users where `subscriptionStatus = "active"` or similar — check User model for subscription fields)
- **Trial users** (subscriptionStatus = "trialing")
- **Documents generated** (count from `prisma.document.count()`)
- **Questionnaires completed** (prisma.questionnaireResponse.count where status = completed or similar)

Look at the User model in `prisma/schema.prisma` to find the correct subscription field names before writing queries.

Layout: 4-6 stat cards at top (like OT admin), then a recent users table below.

### 2. Recent Users Table
On the same admin page, below the stat cards:
- Show last 20 users: email, createdAt, subscriptionStatus, plan
- Sort by createdAt desc
- Use a simple table with shadcn/ui Table component

### 3. Admin Nav
File: `app/admin/layout.tsx` (create if doesn't exist, check if it does first)

Add a simple sidebar or top nav with links to:
- Dashboard (`/admin`)
- Users (`/admin/users` — may already exist)
- Attribution (`/admin/attribution`)
- Marketing Links (`/admin/marketing-links`)
- Subscribers (`/admin/subscribers` — will be added by parallel PR)

Keep it minimal — just a nav bar at the top or a simple left sidebar.

### 4. Users List Page
File: `app/admin/users/page.tsx` (check if exists — if so, review and improve it; if not, create it)

Show all users with:
- email, name, createdAt, subscriptionStatus, subscriptionPlan
- Sort by createdAt desc
- Paginate at 50 per page if >50 users (simple prev/next buttons using searchParams)

### 5. Build and verify
Run: `npm run build`
Fix any TypeScript errors.

## Constraints
- Use existing Prisma + shadcn/ui patterns already in the project
- Check existing admin pages for auth patterns (requireAdmin or similar) and match them
- Do not add new npm dependencies
- Keep styling consistent with the rest of the app (existing Tailwind + shadcn)

## Completion
When `npm run build` succeeds:
1. Commit: `feat: admin dashboard with user stats, recent users, nav`
2. Push: `git push -u origin feat/admin-dashboard`
3. Run: `openclaw system event --text "Done: FS admin dashboard built and pushed" --mode now`
