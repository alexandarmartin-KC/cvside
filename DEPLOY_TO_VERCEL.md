# 🚀 Deploy to Vercel - Quick Guide

## ✅ Code Pushed to GitHub

Your latest changes are now on GitHub:
- GPT-4o Vision CV parser
- Test/debug page
- All improvements

## Deploy to Vercel (2 Options)

### Option 1: Vercel Dashboard (Recommended)

1. **Go to Vercel:** https://vercel.com/dashboard

2. **Import Project:**
   - Click "Add New" → "Project"
   - Select "Import Git Repository"
   - Choose: `alexandarmartin-KC/cvside`
   - Click "Import"

3. **Configure Project:**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `./` (leave as default)
   - Click "Deploy"

4. **Add Environment Variables** (IMPORTANT!)
   
   After first deployment, go to:
   **Project → Settings → Environment Variables**

   Add these variables:

   ```bash
   # Database (REQUIRED)
   DATABASE_URL=postgresql://user:password@host:port/database
   
   # OpenAI API (REQUIRED for CV parsing)
   OPENAI_API_KEY=sk-proj-your-key-here
   
   # Auth (REQUIRED)
   NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
   NEXTAUTH_URL=https://your-app.vercel.app
   
   # Email (Optional - for password reset)
   RESEND_API_KEY=re_your-key-here
   EMAIL_FROM=noreply@yourdomain.com
   ```

5. **Redeploy:**
   - Go to "Deployments"
   - Click "..." on latest deployment
   - Click "Redeploy"

### Option 2: Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login
vercel login

# Deploy
cd /workspaces/cvside
vercel

# Follow prompts:
# - Link to existing project? Yes
# - Which scope? [Your account]
# - Link to alexandarmartin-KC/cvside? Yes
# - Production? Yes
```

## Required Environment Variables

### 1. Database Setup

You need a PostgreSQL database. Options:

#### A. Vercel Postgres (Easiest)
```bash
# In Vercel dashboard:
# Storage → Create Database → Postgres
# Copy the DATABASE_URL and add to env vars
```

#### B. Supabase
```bash
# Go to supabase.com
# Create project
# Get connection string from Settings → Database
```

#### C. Railway.app
```bash
# Go to railway.app
# Create PostgreSQL database
# Copy connection string
```

### 2. Generate Secrets

```bash
# Generate NEXTAUTH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Copy output and use as NEXTAUTH_SECRET
```

### 3. NEXTAUTH_URL

```bash
# After deployment, your URL will be:
https://your-project-name.vercel.app

# Use this as NEXTAUTH_URL
```

## Environment Variables Checklist

Copy this to Vercel Environment Variables:

```env
# ✅ REQUIRED - Database
DATABASE_URL=postgresql://...

# ✅ REQUIRED - OpenAI (for CV parsing)
OPENAI_API_KEY=sk-proj-...

# ✅ REQUIRED - Auth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://your-app.vercel.app

# Optional - Email
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@yourdomain.com

# Optional - Google OAuth (if using)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## Post-Deployment Checklist

After deployment with env vars set:

1. ✅ Visit your app: `https://your-app.vercel.app`
2. ✅ Test signup: `/signup`
3. ✅ Test CV upload: `/upload`
4. ✅ Test debug page: `/test`
5. ✅ Check database: Vercel logs for any errors

## Database Migration

After first deployment with DATABASE_URL:

```bash
# Option 1: Run migration in Vercel build (automatic)
# Already configured in package.json: "build": "prisma generate && next build"

# Option 2: Manual migration (if needed)
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Run migration
vercel env pull .env.production
npx prisma migrate deploy

# Or use Prisma Studio
npx prisma studio
```

## Troubleshooting

### Issue: "Database connection failed"

**Fix:** Make sure DATABASE_URL is set in Vercel env vars and redeploy.

### Issue: "OPENAI_API_KEY not set"

**Fix:** Add OPENAI_API_KEY to Vercel env vars and redeploy.

### Issue: "NEXTAUTH_SECRET not set"

**Fix:** Generate one:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
Add to Vercel env vars and redeploy.

### Issue: Build fails

Check build logs in Vercel dashboard:
- Deployments → [Latest] → Build Logs
- Look for specific error

Common fixes:
- Make sure all env vars are set
- Check DATABASE_URL is correct
- Verify OPENAI_API_KEY is valid

### Issue: App works but CV parser fails

Check:
1. OPENAI_API_KEY is set in Vercel
2. API key has GPT-4o access
3. Visit `/test` page to debug
4. Check Vercel function logs

## Quick Deploy Commands

```bash
# Push to GitHub (already done!)
git push origin main

# Deploy to Vercel
vercel --prod

# Check deployment
vercel ls

# View logs
vercel logs
```

## Domains

### Default Domain
Vercel gives you: `your-project.vercel.app`

### Custom Domain
1. Vercel Dashboard → Project → Settings → Domains
2. Add your domain
3. Update DNS records as shown
4. Update NEXTAUTH_URL to your custom domain

## Cost

### Vercel
- **Hobby Plan**: Free
  - 100GB bandwidth/month
  - Unlimited deployments
  - Perfect for testing

- **Pro Plan**: $20/month
  - More bandwidth
  - Analytics
  - Better for production

### Database
- **Vercel Postgres**: Free tier available
- **Supabase**: Free tier available
- **Railway**: Free tier ($5 credit/month)

### OpenAI
- **GPT-4o Vision**: ~$0.01-0.02 per CV
- Budget accordingly based on usage

## Next Steps

1. ✅ Code pushed to GitHub
2. ⏳ Deploy to Vercel (use Option 1 or 2 above)
3. ⏳ Add environment variables
4. ⏳ Redeploy
5. ⏳ Test your app
6. ⏳ Share the URL!

---

**Your app is ready to deploy!** Follow the steps above to get it live on Vercel. 🚀
