# Authentication Testing Guide

## ✅ Development Server Status
The dev server should be running at: http://localhost:3000

## 🧪 Manual Testing Steps

### 1. Test User Registration

1. **Visit Registration Page**
   - Go to: http://localhost:3000/auth/signup
   - Or click "Get Started" on the home page

2. **Fill Out Registration Form**
   - Name: `Test User` (optional)
   - Email: `test@example.com` (use a unique email)
   - Password: `testpassword123` (minimum 8 characters)

3. **Submit Form**
   - Click "Create account"
   - You should be redirected to the sign-in page with `?registered=true`

4. **Verify in Database** (Optional)
   - Run: `npm run db:studio`
   - Check the `users` table to see your new user
   - Password should be hashed (not plain text)

### 2. Test User Login

1. **Visit Sign In Page**
   - Go to: http://localhost:3000/auth/signin
   - Or click "Sign In" on the home page

2. **Enter Credentials**
   - Email: `test@example.com` (the email you registered with)
   - Password: `testpassword123`

3. **Sign In**
   - Click "Sign in"
   - You should be redirected to: http://localhost:3000/dashboard

4. **Verify Dashboard**
   - You should see:
     - Welcome message with your email
     - Your name (if provided)
     - Dashboard cards for Documents, Case Management, Financial Tools
     - A "Sign Out" button

### 3. Test Protected Routes

1. **Access Dashboard Directly**
   - Try visiting: http://localhost:3000/dashboard
   - While logged out, you should be redirected to `/auth/signin`

2. **Sign Out**
   - Click "Sign Out" on the dashboard
   - You should be redirected to the home page

3. **Try Dashboard Again**
   - Visit: http://localhost:3000/dashboard
   - Should redirect to sign-in (protected route working)

### 4. Test Error Cases

1. **Invalid Credentials**
   - Try signing in with wrong password
   - Should show error: "Invalid password"

2. **Non-existent User**
   - Try signing in with email that doesn't exist
   - Should show error: "No user found with this email"

3. **Duplicate Registration**
   - Try registering with the same email twice
   - Should show error: "User with this email already exists"

4. **Invalid Email Format**
   - Try registering with invalid email
   - Should show validation error

5. **Short Password**
   - Try registering with password less than 8 characters
   - Should show validation error

## 🐛 Troubleshooting

### Server Not Running?
```bash
cd newstart-il
npm run dev
```

### Database Connection Issues?
- Check `.env.local` has correct `DATABASE_URL`
- Verify Supabase project is active
- Run `npm run db:studio` to test connection

### Import Errors?
- Make sure Prisma Client is generated: `npm run db:generate`
- Restart the dev server

### Session Not Working?
- Check `NEXTAUTH_SECRET` is set in `.env.local`
- Clear browser cookies and try again

## ✅ Expected Results

After successful testing, you should be able to:
- ✅ Create new user accounts
- ✅ Sign in with valid credentials
- ✅ Access protected dashboard when logged in
- ✅ Be redirected to sign-in when accessing protected routes while logged out
- ✅ See appropriate error messages for invalid inputs
- ✅ Sign out and return to public pages

## 📝 Test Checklist

- [ ] Registration form works
- [ ] User can register with valid data
- [ ] Password is hashed in database
- [ ] Sign in form works
- [ ] User can sign in with valid credentials
- [ ] Dashboard is accessible when logged in
- [ ] Protected routes redirect when logged out
- [ ] Sign out works correctly
- [ ] Error messages display correctly
- [ ] Form validation works (email format, password length)

---

**Once testing is complete, authentication is ready for production use!** 🎉
