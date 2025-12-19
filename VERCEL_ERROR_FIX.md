# Fixing Vercel Deployment Error

## Problem
The deployment pushed new code that references `rawCvText` field, but the database hasn't been migrated yet.

## Solution: Run Database Migration

### Option 1: Via Vercel CLI (Recommended)
```bash
# Install Vercel CLI if needed
npm i -g vercel

# Link to your project
vercel link

# Get your DATABASE_URL from environment
vercel env pull .env.production

# Run migration
DATABASE_URL="$(grep DATABASE_URL .env.production | cut -d '=' -f2-)" npx prisma migrate deploy
```

### Option 2: Via Vercel Dashboard
1. Go to https://vercel.com/alexandarmartin-KC/cvside
2. Settings → Environment Variables
3. Copy your `DATABASE_URL`
4. In your local terminal:
   ```bash
   DATABASE_URL="your-copied-url" npx prisma migrate deploy
   ```

### Option 3: Direct PostgreSQL Access
If you have direct access to your PostgreSQL database:
```sql
ALTER TABLE "CvProfile" ADD COLUMN IF NOT EXISTS "rawCvText" TEXT;
```

## Quick Rollback (If Needed)
If you need to rollback immediately while figuring out migration:
```bash
git revert HEAD
git push origin main
```

This will revert the changes and redeploy the old version.

## After Migration
Once migration is complete:
1. Refresh your Vercel deployment (it should work now)
2. Test CV upload → saved jobs flow
3. Test CV tailoring with a job

## Verify Migration Worked
```bash
# Check if column exists
DATABASE_URL="your-url" npx prisma db execute --stdin <<< "
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'CvProfile' AND column_name = 'rawCvText';"
```

