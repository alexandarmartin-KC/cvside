# Database Setup for Vercel

The save job functionality requires a PostgreSQL database. Here's how to set it up:

## Option 1: Vercel Postgres (Recommended)

1. Go to your Vercel project dashboard
2. Click on the "Storage" tab
3. Click "Create Database"
4. Select "Postgres"
5. Choose a database name (e.g., `cvside-db`)
6. Click "Create"
7. Vercel will automatically add the `DATABASE_URL` environment variable

## Option 2: Supabase (Free Alternative)

1. Go to https://supabase.com and create a free account
2. Create a new project
3. Go to Project Settings → Database
4. Copy the "Connection string" (URI format)
5. In your Vercel project:
   - Go to Settings → Environment Variables
   - Add `DATABASE_URL` with the connection string
   - Redeploy your application

## After Setting Up Database

Run the Prisma migration to create tables:

```bash
# If using Vercel Postgres, install Vercel CLI
npm i -g vercel

# Pull environment variables
vercel env pull .env.local

# Run migration
npx prisma migrate deploy

# Or create a new migration
npx prisma migrate dev --name init
```

## Test Database Connection

Visit: `https://your-app.vercel.app/api/health`

You should see:
```json
{
  "status": "ok",
  "database": "configured"
}
```

## Current Status

Without database configuration:
- ✅ Upload CV works (uses mock data)
- ✅ View job matches works
- ✅ Read more works (client-side)
- ❌ Save job fails (needs database)
- ❌ Dashboard saved jobs (needs database)
