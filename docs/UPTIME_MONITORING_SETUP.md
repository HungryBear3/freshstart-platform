# Production Uptime Monitoring (UptimeRobot)

UptimeRobot offers a free tier for monitoring your site's availability. When the site goes down, you get alerts by email.

## Setup (5 minutes)

### 1. Create account

1. Go to **https://uptimerobot.com**
2. Sign up (free tier: 50 monitors, 5-minute check interval)

### 2. Add a monitor

1. Click **Add New Monitor**
2. **Monitor Type:** HTTP(s)
3. **Friendly Name:** FreshStart IL (or your site name)
4. **URL:** `https://www.freshstart-il.com`
5. **Monitoring Interval:** 5 minutes (free tier)
6. Click **Create Monitor**

### 3. Add alert contact

1. Go to **My Settings** → **Alert Contacts**
2. Click **Add Alert Contact**
3. **Alert Contact Type:** Email
4. Enter your email
5. Click **Create Alert Contact**

### 4. Link monitor to alert

1. Go to **Dashboard** → click your monitor
2. Under **Alert Contacts**, add your email contact
3. Save

## What you get

- **Uptime monitoring** – Check every 5 minutes
- **Email alerts** – When the site is down or back up
- **Status page** – Optional public status page

## Optional: API health check

For a more reliable check, you can monitor an API endpoint instead of the homepage:

- **URL:** `https://www.freshstart-il.com/api/deploy-info`

This endpoint returns JSON when the app is running. If it fails, the site is likely down.

## Optional: Response time

UptimeRobot also tracks response time. If you see slow responses (>3–5 seconds), investigate performance.

---

**Quick checklist**

- [ ] UptimeRobot account created
- [ ] Monitor added for www.freshstart-il.com
- [ ] Alert contact (email) added
- [ ] Monitor linked to alert contact
