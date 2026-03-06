# Deployment Guide

## Pre-Deployment Checklist

### Environment Variables
Ensure all required environment variables are set in your hosting platform:

```bash
# NextAuth Configuration
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# Database
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Encryption
ENCRYPTION_KEY=<generate-with-openssl-rand-hex-32>

# CORS
ALLOWED_ORIGIN=https://your-domain.com

# Node Environment
NODE_ENV=production

# Optional: Error Tracking
SENTRY_DSN=<your-sentry-dsn>
```

### Generate Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate ENCRYPTION_KEY
openssl rand -hex 32
```

## Deployment Options

### Option 1: Vercel (Recommended for Next.js)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Link your project**:
   ```bash
   vercel link
   ```

4. **Set environment variables**:
   ```bash
   vercel env add NEXTAUTH_URL
   vercel env add NEXTAUTH_SECRET
   vercel env add DATABASE_URL
   vercel env add ENCRYPTION_KEY
   vercel env add ALLOWED_ORIGIN
   ```

5. **Deploy**:
   ```bash
   vercel --prod
   ```

   Or use the Vercel dashboard:
   - Push to GitHub
   - Import project in Vercel
   - Configure environment variables
   - Deploy

### Option 2: AWS (EC2, ECS, or Lambda)

#### Using AWS Amplify
1. Connect your GitHub repository
2. Configure build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm install
           - npm run db:generate
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```
3. Set environment variables in Amplify console
4. Deploy

#### Using AWS ECS/Fargate
1. Build Docker image:
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build
   RUN npm run db:generate
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. Push to ECR
3. Create ECS task definition
4. Deploy to ECS service

### Option 3: Railway

1. **Connect GitHub repository** to Railway
2. **Set environment variables** in Railway dashboard
3. **Configure build**:
   - Build Command: `npm run build`
   - Start Command: `npm start`
4. **Deploy**

### Option 4: DigitalOcean App Platform

1. **Create new app** from GitHub repository
2. **Configure build**:
   - Build Command: `npm run build && npm run db:generate`
   - Run Command: `npm start`
3. **Set environment variables**
4. **Deploy**

## Database Setup

### Production Database (Supabase)

1. **Create production database** in Supabase
2. **Update DATABASE_URL** with production credentials
3. **Run migrations**:
   ```bash
   npx prisma migrate deploy
   ```
4. **Generate Prisma client**:
   ```bash
   npm run db:generate
   ```

### Database Backups

- **Supabase**: Automatic daily backups (verify in Supabase dashboard)
- **Manual backup**:
  ```bash
  pg_dump $DATABASE_URL > backup.sql
  ```

## Post-Deployment Steps

### 1. Verify Deployment
- [ ] Check application loads correctly
- [ ] Test authentication (sign up, sign in)
- [ ] Verify database connection
- [ ] Test critical user flows

### 2. Security Verification
- [ ] HTTPS is enforced
- [ ] Security headers are present (check with securityheaders.com)
- [ ] Environment variables are set correctly
- [ ] No sensitive data in client-side code

### 3. Monitoring Setup
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Uptime monitoring set up
- [ ] Log aggregation configured
- [ ] Alerts configured

### 4. Performance
- [ ] CDN configured (if applicable)
- [ ] Static assets optimized
- [ ] Database queries optimized
- [ ] Load testing completed

## Environment-Specific Configuration

### Development
```bash
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
ALLOWED_ORIGIN=*
```

### Staging
```bash
NODE_ENV=production
NEXTAUTH_URL=https://staging.your-domain.com
ALLOWED_ORIGIN=https://staging.your-domain.com
```

### Production
```bash
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
ALLOWED_ORIGIN=https://your-domain.com
```

## Rollback Procedure

### Vercel
```bash
vercel rollback [deployment-url]
```

### AWS/GitHub Actions
1. Revert to previous commit
2. Trigger deployment pipeline
3. Or manually deploy previous version

## Troubleshooting

### Build Failures
- Check Node.js version (requires 18+)
- Verify all dependencies are installed
- Check for TypeScript errors: `npm run type-check`
- Verify Prisma client is generated: `npm run db:generate`

### Runtime Errors
- Check environment variables are set
- Verify database connection
- Check application logs
- Review error tracking (Sentry, etc.)

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check SSL mode (should be `require` for Supabase)
- Verify database is accessible from hosting platform
- Check firewall rules

## Continuous Deployment

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: npm run db:generate
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Maintenance

### Regular Tasks
- **Weekly**: Review error logs and performance metrics
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Review and optimize database queries
- **Annually**: Security audit and penetration testing

### Updates
1. Test updates in staging environment
2. Review changelog and breaking changes
3. Update dependencies: `npm update`
4. Run tests: `npm test`
5. Deploy to production

## Support

For deployment issues, check:
- Application logs in hosting platform
- Error tracking (Sentry, etc.)
- Database connection status
- Environment variable configuration
