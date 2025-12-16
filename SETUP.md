# CV Matcher - Setup Guide

## Authentication & Dashboard Implementation

This guide explains how to set up the authenticated dashboard system for CV Matcher.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- Google OAuth credentials
- OpenAI API key

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your credentials:

- **DATABASE_URL**: Your PostgreSQL connection string
- **NEXTAUTH_SECRET**: Generate with `openssl rand -base64 32`
- **NEXTAUTH_URL**: `http://localhost:3000` for local, your domain for production
- **GOOGLE_CLIENT_ID** & **GOOGLE_CLIENT_SECRET**: From Google Cloud Console
- **OPENAI_API_KEY**: From OpenAI platform

### 3. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (local)
   - `https://your-domain.com/api/auth/callback/google` (production)
7. Copy Client ID and Client Secret to `.env.local`

### 4. Set Up Database

Initialize Prisma and create database schema:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

This will:
- Generate the Prisma Client
- Create all database tables
- Set up relationships

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Database Schema

The system uses these main models:

### Auth Models (NextAuth)
- **User**: User accounts with OAuth info
- **Account**: OAuth provider accounts
- **Session**: Active user sessions
- **VerificationToken**: Email verification tokens

### App Models
- **CvProfile**: User's CV data (skills, locations, preferences)
- **Job**: Job listings from various sources
- **JobMatch**: Computed matches between users and jobs
- **SavedJob**: Jobs saved by users
- **AppliedJob**: Jobs users have applied to (with pipeline status)
- **SeenJob**: Tracks which jobs users have viewed

## Dashboard Features

### Pages

1. **Overview** (`/dashboard`)
   - Stats cards (new jobs, applied, follow-ups due)
   - Top job matches
   - Follow-up reminders

2. **Job Matches** (`/dashboard/matches`)
   - Filtered job list
   - Match scores and reasons
   - Refresh jobs button
   - Save/Apply actions

3. **Saved Jobs** (`/dashboard/saved`)
   - List of saved jobs
   - Move to applied
   - Remove from saved

4. **Applied Jobs** (`/dashboard/applied`)
   - Kanban-style pipeline
   - Statuses: SAVED → APPLIED → INTERVIEW → OFFER → REJECTED
   - Edit notes and status

5. **CV & Preferences** (`/dashboard/profile`)
   - Edit skills and locations
   - Set preferred location
   - Recompute matches

6. **Insights** (`/dashboard/insights`)
   - Applications by week
   - Top matching locations
   - Response rate stats

7. **Privacy & Data** (`/dashboard/privacy`)
   - Export all data (JSON)
   - Delete account and data

### API Routes

All under `/api/dashboard/`:

- `POST /jobs/save` - Save a job
- `POST /jobs/unsave` - Unsave a job
- `POST /jobs/apply` - Mark job as applied
- `POST /jobs/update-applied` - Update applied job status/notes
- `POST /jobs/refresh` - Generate new job matches
- `POST /profile/update` - Update CV profile
- `GET /me/export` - Export user data
- `POST /me/delete` - Delete user account

## Deployment to Vercel

### 1. Set Up Database

Recommended: Use [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)

```bash
vercel env add DATABASE_URL
```

Paste your PostgreSQL connection string.

### 2. Add Environment Variables in Vercel

Go to Project Settings → Environment Variables and add:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (your production URL)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `OPENAI_API_KEY`

### 3. Run Migrations in Production

After first deploy, run:

```bash
vercel env pull .env.local
npx prisma migrate deploy
```

Or add this to your `package.json`:

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

### 4. Update Google OAuth Redirect

Add your production URL to Google Cloud Console:
- `https://your-domain.vercel.app/api/auth/callback/google`

## How It Works

### Job Matching Algorithm (MVP)

Located in `/api/dashboard/jobs/refresh/route.ts`:

```
Base Score: 60

+ (Skill Overlap Count × 8)
+ (Location Match: 15 points)
+ (Preferred Location: 10 points)
+ (Remote if preferred: 10 points)

Max Score: 100
```

### Mock Jobs

On first "Refresh Jobs", the system seeds 5 mock jobs. You can:
- Add more mock jobs in the seed function
- Replace with real job API integration later
- Import jobs from CSV/JSON

### Upload Flow Integration

When a logged-in user uploads a CV on `/upload`, the system should:
1. Parse the CV (existing behavior)
2. Save `CvProfile` to database for that user
3. Automatically run job matching

## Development Tips

### Prisma Studio

View and edit database records:

```bash
npx prisma studio
```

### Reset Database

```bash
npx prisma migrate reset
```

### Generate Types

After schema changes:

```bash
npx prisma generate
```

### Debugging Auth

Check session:

```tsx
import { auth } from '@/auth';

const session = await auth();
console.log(session);
```

## Customization

### Adding More OAuth Providers

Edit `/auth.ts`:

```ts
providers: [
  Google({ ... }),
  GitHub({
    clientId: process.env.GITHUB_ID,
    clientSecret: process.env.GITHUB_SECRET,
  }),
],
```

### Changing Match Algorithm

Edit `/api/dashboard/jobs/refresh/route.ts` and adjust scoring logic.

### Custom Job Sources

Replace mock jobs in `seedMockJobs()` with:
- API calls to LinkedIn, Indeed, etc.
- Scraping (be careful with ToS)
- Partner API integrations

## Troubleshooting

### "Invalid `prisma.xxx.findMany()` invocation"

Run `npx prisma generate` to regenerate client.

### OAuth Error "redirect_uri_mismatch"

Ensure the redirect URI in Google Console exactly matches your app's URL.

### Database Connection Error

Check `DATABASE_URL` format:
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
```

### NextAuth Session Not Persisting

Check:
1. `NEXTAUTH_SECRET` is set
2. `NEXTAUTH_URL` matches your domain
3. Cookies are enabled in browser

## Security Notes

- Never commit `.env.local` to git
- Rotate `NEXTAUTH_SECRET` periodically
- Use environment variables for all secrets
- Prisma automatically escapes SQL inputs (safe from injection)
- OAuth tokens are stored hashed in database

## Support

For issues:
1. Check Prisma logs: `npx prisma studio`
2. Check Network tab for API errors
3. Check server logs: `npm run dev` output
4. Verify environment variables are loaded

## Next Steps

- Add email notifications for follow-ups
- Integrate real job APIs
- Add resume parser improvements
- Implement job alerts
- Add team collaboration features
