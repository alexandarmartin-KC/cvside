# Vercel Deployment Checklist

## 🚨 IMPORTANT: Add These Environment Variables in Vercel

Before the app will work on Vercel, you MUST add these environment variables:

### Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

### Required Variables:

1. **DATABASE_URL**
   ```
   postgresql://user:password@host:port/database
   ```
   - Your Postgres database connection string
   - Available from your database provider (Vercel Postgres, Supabase, etc.)

2. **AUTH_SECRET**
   ```
   Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
   - Must be at least 32 characters
   - Keep it secret!

3. **APP_URL**
   ```
   https://your-app.vercel.app
   ```
   - Your Vercel production URL
   - Used in password reset emails

4. **RESEND_API_KEY**
   ```
   re_xxxxxxxxxxxxx
   ```
   - Get from https://resend.com
   - Needed for password reset emails

5. **EMAIL_FROM**
   ```
   noreply@yourdomain.com
   ```
   - The "from" address for password reset emails
   - Must be verified in Resend

## 📋 Post-Deployment Steps

### 1. After adding environment variables, redeploy:
   - Vercel Dashboard → Deployments → Click "..." → Redeploy

### 2. Run database migration:
   The migration will run automatically on Vercel, OR you can run manually:
   ```bash
   # Connect to your database and run:
   npx prisma migrate deploy
   ```

### 3. Test the authentication:
   - Visit your Vercel URL
   - Click "Sign Up / Login"
   - Create an account
   - Try password reset flow

## 🔍 Troubleshooting

### If signup/login fails:
- Check DATABASE_URL is correct
- Check AUTH_SECRET is set
- Look at Vercel function logs

### If password reset email doesn't send:
- Check RESEND_API_KEY is valid
- Check EMAIL_FROM is verified in Resend
- Check APP_URL matches your Vercel URL

### If you see "Environment variable not found":
- Make sure all variables are added in Vercel
- Redeploy after adding variables
- Check variable names match exactly (case-sensitive)

## ✅ Quick Verification

After deployment, test these URLs:
- ✅ `/signup` - Should show signup form
- ✅ `/login` - Should show login form  
- ✅ `/forgot-password` - Should show password reset form
- ✅ `/dashboard` - Should redirect to login if not authenticated

## 🎯 Database Migration

The Prisma migration will add:
- `passwordHash` column to User table
- New `PasswordResetToken` table

This happens automatically on first deployment with DATABASE_URL set.

## 📞 Need Help?

Check the logs:
- Vercel Dashboard → Your Project → Deployments → Click deployment → Functions tab
- Look for error messages in the logs

Common issues:
- Missing environment variables
- Database connection issues  
- Resend API key not activated
- EMAIL_FROM not verified
