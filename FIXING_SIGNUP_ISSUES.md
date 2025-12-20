# 🔧 Fixing Signup & Upload Issues

## The Problem

You can't create a user when you visit `/upload` because:
1. The upload page works without login (for convenience)
2. But you need an account to save your parsed CV
3. The signup flow may have database connection issues

## Quick Fix: Test Page Created! ✅

I've created a **test page** to help you debug: **http://localhost:3000/test**

This page lets you:
- ✅ Test database connection
- ✅ Test authentication status  
- ✅ Test signup (creates random test users)
- ✅ Test CV parser without needing to login

## How to Use the Test Page

### Step 1: Start Your Server

```bash
npm run dev
```

### Step 2: Visit the Test Page

Open: **http://localhost:3000/test**

### Step 3: Run Tests

1. **Click "Test Database Connection"**
   - Should show: `{ "status": "ok" }`
   - If error: Your database isn't connected

2. **Click "Test Signup (Create Test User)"**
   - Creates: `test[timestamp]@example.com`
   - Password: `testpassword123`
   - Should show success + user details

3. **Click "Test CV Parser"**
   - Tests GPT-4o Vision without authentication
   - Should extract name, experience, skills

## Common Issues & Fixes

### Issue 1: Database Connection Error

**Symptoms:**
- "Database connection failed"
- "Prisma client not initialized"

**Fix:**
```bash
# Make sure database is running (in dev container it should be)
# Then run migrations
npx prisma migrate dev --schema=./prisma/schema.prisma

# Generate Prisma client
npx prisma generate
```

### Issue 2: "Can't create user" on Signup

**Symptoms:**
- Signup button does nothing
- Console shows 500 error

**Fix:**
```bash
# Check if database schema is up to date
npx prisma db push

# Or run migrations
npx prisma migrate dev
```

### Issue 3: CV Upload Works but Can't Save

**Symptoms:**
- CV parses successfully
- But can't save to profile
- Prompted to login

**This is expected!** Flow:
1. Upload CV (no login needed)
2. See results
3. Click "Save Profile" → Redirected to signup/login
4. After signup → CV data saved automatically

### Issue 4: Signup Page Doesn't Redirect

**Symptoms:**
- Create account succeeds
- But stays on signup page
- Doesn't go to dashboard

**Fix:** Check browser console for errors. The signup should:
1. Create account
2. Create session
3. Save pending CV (if any)
4. Redirect to `/dashboard`

## Testing the Full Flow

### Option A: Anonymous Upload (Current Design)

```
1. Visit /upload (no login)
2. Upload your CV
3. See parsed results
4. Click "Save Profile"
5. Redirected to /signup
6. Create account
7. CV automatically saved
8. Redirected to /dashboard
```

### Option B: Login First

```
1. Visit /signup
2. Create account
3. Visit /upload
4. Upload CV
5. Results saved immediately
6. View in /dashboard
```

## Quick Commands

### Reset Database (if needed)
```bash
# Reset database and run all migrations
npx prisma migrate reset

# Or just push schema
npx prisma db push
```

### Check Database
```bash
# Open Prisma Studio to view data
npx prisma studio
```

### Test OpenAI Connection
```bash
# Run the test script
node scripts/test-gpt4o-vision.js
```

## Debugging with Test Page

The `/test` page gives you instant feedback:

### Green (✅) = Working
- Database connected
- Signup works
- CV parser works

### Red (❌) = Broken
- Check the error message
- Look at console logs
- Follow fixes above

## Example Test Flow

1. **Visit** http://localhost:3000/test

2. **Click** "Test Database Connection"
   ```json
   {
     "status": "ok",
     "database": "connected",
     "timestamp": "2025-12-20T..."
   }
   ```

3. **Click** "Test Signup"
   ```json
   {
     "success": true,
     "email": "test1703000000@example.com",
     "data": {
       "user": {
         "id": "...",
         "email": "test1703000000@example.com",
         "name": "Test User"
       }
     }
   }
   ```

4. **Click** "Test CV Parser"
   ```json
   {
     "success": true,
     "data": {
       "cvProfile": {
         "name": "John Doe",
         "title": "Senior Software Engineer",
         "experience": [...],
         "skills": [...]
       }
     }
   }
   ```

## What the Test Page Does

### Database Test
- Calls `/api/health`
- Verifies Prisma connection
- Shows database status

### Auth Test
- Calls `/api/auth/check-session`
- Shows if you're logged in
- Displays user info if logged in

### Signup Test
- Generates random email: `test[timestamp]@example.com`
- Password: `testpassword123`
- Creates real user in database
- Shows success/error

### CV Parser Test
- Creates sample CV text
- Calls `/api/cv/parse`
- Tests GPT-4o Vision
- No authentication required

## URLs You Can Use

| URL | Purpose | Auth Required |
|-----|---------|--------------|
| `/test` | Debug & test page | No |
| `/upload` | Upload CV and parse | No |
| `/signup` | Create account | No |
| `/login` | Login | No |
| `/dashboard` | View profile & jobs | Yes |

## Expected Behavior

### For Anonymous Users
1. Can upload and parse CV ✅
2. Can see job matches ✅
3. Cannot save profile ❌ (redirected to signup)
4. Cannot save jobs ❌ (redirected to login)

### For Logged-In Users
1. Can upload and parse CV ✅
2. Can see job matches ✅
3. Can save profile ✅
4. Can save jobs ✅
5. Can view saved jobs in dashboard ✅

## Still Having Issues?

### Check Logs
```bash
# In terminal running npm run dev
# Look for:
# - "Signup error:" 
# - "Failed to create account"
# - "Prisma" errors
```

### Use Test Page
Visit `/test` and run all tests. Share the results to debug further.

### Common Fixes
```bash
# Fix 1: Reset everything
npx prisma migrate reset
npm run dev

# Fix 2: Just regenerate client
npx prisma generate
npm run dev

# Fix 3: Check env vars
cat .env.local | grep -E "DATABASE_URL|OPENAI_API_KEY"
```

## Success Checklist

- ✅ Database connected (test page shows "ok")
- ✅ Can create test user (test page signup works)
- ✅ CV parser works (test page shows parsed data)
- ✅ Can visit `/upload` without login
- ✅ Can create account via `/signup`
- ✅ After signup, redirected to `/dashboard`

If all checklist items pass, your app is working correctly! 🎉

The design **intentionally allows** anonymous CV uploads, then prompts for signup when saving. This is to reduce friction in the initial experience.
