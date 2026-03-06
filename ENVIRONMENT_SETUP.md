# Environment Setup Guide

## Development Environment

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (or Supabase account)
- Git (for version control)

### Setup Steps

1. **Clone the repository** (when git is initialized)
   ```bash
   git clone <repository-url>
   cd newstart-il
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env.local`
   - Fill in all required variables (see below)

4. **Set up database**
   ```bash
   npm run db:migrate
   npm run db:generate
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

## Environment Variables

### Required for Development

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/newstart_il"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# Email (optional for development - emails will be logged to console)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="your-email@gmail.com"

# File Storage
STORAGE_TYPE="local"  # "local" for development, "s3" for production
LOCAL_STORAGE_PATH="./uploads"
```

### Production Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="production-secret-key"

# Email
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASSWORD="your-sendgrid-api-key"
SMTP_FROM="noreply@yourdomain.com"

# File Storage
STORAGE_TYPE="s3"
AWS_S3_BUCKET="your-bucket-name"
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"

# Logging (optional)
SENTRY_DSN="your-sentry-dsn"
LOG_LEVEL="error"  # "debug" | "info" | "warn" | "error"
```

## Staging Environment

Staging should mirror production but with:
- Separate database
- Separate S3 bucket (or folder)
- Staging domain URL
- Test email addresses

## Environment-Specific Scripts

- **Development**: `npm run dev`
- **Build**: `npm run build`
- **Production**: `npm start`
- **Testing**: `npm test`

## Security Notes

- Never commit `.env.local` or `.env` files
- Use different secrets for each environment
- Rotate secrets regularly
- Use environment-specific database credentials
- Enable HTTPS in production
- Use secure file storage (S3) in production
