# Complete Authentication System - Setup Guide

## ✅ Implementation Complete

A full authentication system with signup, login, logout, and password reset has been implemented.

## 📋 What Was Implemented

### 1. Database Schema (Prisma)
- Updated `User` model with `passwordHash` field
- Added `PasswordResetToken` model with token expiry
- CV requirement enforcement in dashboard

### 2. Authentication System (`lib/auth-session.ts`)
- JWT-based session management using jose library
- Secure httpOnly cookies (name: `cv_session`)
- Functions: `createSession`, `getSessionUser`, `requireUser`, `signOut`

### 3. API Routes (`/api/auth/*`)
- ✅ `POST /api/auth/signup` - Create new account
- ✅ `POST /api/auth/login` - Sign in with email/password
- ✅ `POST /api/auth/logout` - Clear session
- ✅ `POST /api/auth/forgot-password` - Request password reset
- ✅ `POST /api/auth/reset-password` - Reset password with token

### 4. UI Pages
- ✅ `/signup` - Clean signup form with validation
- ✅ `/login` - Login form with "Forgot password?" link
- ✅ `/forgot-password` - Password reset request
- ✅ `/reset-password` - Reset password with token from email

### 5. Dashboard Protection
- ✅ `requireUser()` blocks unauthenticated access
- ✅ Redirects to `/upload` if no CV profile exists
- ✅ Logout button integrated in dashboard

### 6. Email Service (`lib/email.ts`)
- ✅ Password reset emails via Resend
- ✅ Professional HTML templates
- ✅ 30-minute token expiry

### 7. Security Features
- ✅ Password minimum 8 characters
- ✅ bcrypt hashing (cost: 12)
- ✅ Tokens hashed before storage
- ✅ Rate limiting on password reset (3 requests/minute)
- ✅ No user enumeration (forgot password always returns success)

## 🔧 Required Environment Variables

Add these to your `.env` file:

```env
# Database
DATABASE_URL="postgresql://user:password@host:port/database"

# Authentication
AUTH_SECRET="your-secure-random-secret-min-32-chars"

# Application URL
APP_URL="https://your-app.vercel.app"
# or for local development:
# APP_URL="http://localhost:3000"

# Email (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxxx"
EMAIL_FROM="noreply@yourdomain.com"
```

## 🚀 Setup Steps

### 1. Install Dependencies
```bash
npm install
```

Already installed:
- `bcryptjs` & `@types/bcryptjs` - Password hashing
- `jose` - JWT handling
- `resend` - Email sending

### 2. Configure Environment Variables
Create/update `.env` with the variables above.

**Generate AUTH_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Setup Resend (for password reset emails)
1. Sign up at https://resend.com
2. Get your API key
3. Verify your domain (or use resend.dev for testing)
4. Add `RESEND_API_KEY` and `EMAIL_FROM` to `.env`

### 4. Run Database Migration
```bash
npx prisma migrate dev --name add_password_auth
```

This creates the `PasswordResetToken` table and adds `passwordHash` to User.

### 5. Generate Prisma Client
```bash
npx prisma generate
```

### 6. Start Development Server
```bash
npm run dev
```

## 📱 User Flows

### New User Signup
1. Visit `/signup`
2. Enter name (optional), email, password
3. Auto-logged in and redirected to `/dashboard`
4. If no CV → redirected to `/upload`

### Existing User Login
1. Visit `/login`
2. Enter email and password
3. Redirected to `/dashboard`

### Forgot Password
1. Visit `/forgot-password`
2. Enter email
3. Receive reset email (if account exists)
4. Click link in email → `/reset-password?token=xxx`
5. Enter new password
6. Auto-logged in and redirected to `/dashboard`

### Dashboard Access Rules
- ❌ Not logged in → Redirect to `/login`
- ❌ Logged in, no CV → Redirect to `/upload`
- ✅ Logged in with CV → Dashboard access granted

## 🔐 Security Notes

### Password Requirements
- Minimum 8 characters
- Hashed with bcrypt (cost: 12)
- Never stored in plain text

### Session Management
- JWT stored in httpOnly cookie
- 7-day expiration
- Secure flag in production
- sameSite=lax protection

### Password Reset Tokens
- 32-byte random tokens
- Hashed before storage in database
- 30-minute expiration
- Deleted after use
- Rate limited (3 requests/minute per email)

### User Enumeration Prevention
- Forgot password always returns success
- Login errors don't specify if email or password is wrong

## 🗂️ File Structure

```
app/
├── signup/page.tsx                    # Signup form
├── login/page.tsx                     # Login form  
├── forgot-password/page.tsx           # Password reset request
├── reset-password/page.tsx            # Password reset form
├── dashboard/
│   ├── layout.tsx                     # Protected layout with auth check
│   └── page.tsx                       # Dashboard (requires CV)
└── api/auth/
    ├── signup/route.ts                # POST signup endpoint
    ├── login/route.ts                 # POST login endpoint
    ├── logout/route.ts                # POST logout endpoint
    ├── forgot-password/route.ts       # POST forgot password endpoint
    └── reset-password/route.ts        # POST reset password endpoint

lib/
├── auth-session.ts                    # JWT session management
├── email.ts                           # Email sending (Resend)
└── prisma.ts                          # Prisma client

prisma/
└── schema.prisma                      # Updated with User.passwordHash & PasswordResetToken
```

## 🧪 Testing the System

### Test Signup Flow
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234","name":"Test User"}'
```

### Test Login Flow
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test1234"}'
```

### Test Forgot Password
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## 📦 Deployment to Vercel

### 1. Add Environment Variables
In Vercel dashboard → Settings → Environment Variables, add:
- `DATABASE_URL`
- `AUTH_SECRET`
- `APP_URL`
- `RESEND_API_KEY`
- `EMAIL_FROM`

### 2. Deploy
```bash
git add .
git commit -m "Add complete authentication system"
git push
```

Vercel will auto-deploy and run migrations.

## 🔄 Migration from NextAuth

If you previously used NextAuth:
1. ✅ User model already compatible (kept existing fields)
2. ✅ Accounts/Sessions tables preserved
3. ✅ Can coexist with OAuth providers if needed
4. ✅ New users will use password auth
5. ✅ Existing OAuth users unaffected

## ⚠️ Important Notes

### CV Requirement
The dashboard enforces CV upload. Users are redirected to `/upload` if they don't have a CV profile. This is intentional per your product requirements.

### Email Sending
- Resend is recommended (simple, reliable)
- For testing, emails may go to spam
- Verify your domain in Resend for production

### Rate Limiting
- Basic in-memory rate limiting on forgot-password
- For production, consider Redis-based rate limiting
- Current limit: 3 requests per minute per email

## 📞 Support

If you encounter issues:
1. Check environment variables are set correctly
2. Ensure DATABASE_URL is valid
3. Verify Resend API key is active
4. Check server logs for detailed errors

## ✨ Next Steps

Optional enhancements:
- Add email verification on signup
- Implement "Remember me" functionality  
- Add two-factor authentication
- Social login (Google, GitHub) alongside password auth
- More sophisticated rate limiting with Redis
- Password strength indicator in UI
- Account lockout after failed attempts
