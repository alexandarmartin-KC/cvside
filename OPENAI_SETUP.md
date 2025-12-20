# OpenAI Setup Guide

## Issue: "OpenAI parsing failed, extracting basic info"

This error occurs because the **OPENAI_API_KEY** environment variable is not set.

## Quick Fix

### Step 1: Get an OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

### Step 2: Create .env.local file

In your project root directory (`/workspaces/cvside`), create a `.env.local` file:

```bash
cp .env.local.example .env.local
```

### Step 3: Add Your API Key

Edit `.env.local` and replace the placeholder:

```env
OPENAI_API_KEY=sk-your-actual-key-here
```

### Step 4: Test the Connection

Run the test script to verify:

```bash
npx tsx scripts/test-openai-connection.ts
```

You should see:
```
✅ OPENAI_API_KEY is set
✅ OpenAI API connection successful!
✅ Your OpenAI integration is working correctly!
```

### Step 5: Restart Your Dev Server

If running locally:
```bash
npm run dev
```

The CV parser will now use OpenAI for intelligent parsing!

---

## For Vercel Deployment

### Add Environment Variable to Vercel

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - **Name**: `OPENAI_API_KEY`
   - **Value**: `sk-your-actual-key-here`
   - **Environment**: Production, Preview, Development (all)
5. Click **Save**
6. Redeploy your application

---

## Current Behavior

### Without OpenAI API Key
- ✅ Basic CV parsing works (name, email, phone, skills)
- ❌ No experience/education extraction
- ❌ No intelligent date parsing
- Falls back to regex-based extraction

### With OpenAI API Key
- ✅ Full CV parsing (all fields)
- ✅ Intelligent experience extraction with dates
- ✅ Education parsing
- ✅ Handles complex layouts
- ✅ Multi-language support
- ✅ Confidence scoring
- ✅ Source snippets for verification

---

## Common Issues

### Issue: 401 Unauthorized
**Cause**: Invalid API key

**Fix**:
- Double-check you copied the full key
- Generate a new key at https://platform.openai.com/api-keys
- Make sure there are no extra spaces

### Issue: 429 Rate Limit
**Cause**: Exceeded API quota or rate limit

**Fix**:
- Check usage at https://platform.openai.com/usage
- Upgrade your OpenAI plan
- Wait for quota reset (if on free tier)

### Issue: 404 Model Not Found
**Cause**: GPT-4 access not available for your account

**Fix**: 
In `app/api/cv/parse/route.ts`, change:
```typescript
model: 'gpt-4',
```
to:
```typescript
model: 'gpt-3.5-turbo',
```

---

## Cost Considerations

### GPT-4 Pricing (as of Dec 2024)
- Input: ~$0.03 per 1K tokens
- Output: ~$0.06 per 1K tokens
- Average CV parse: ~$0.05-0.15 per CV

### GPT-3.5-Turbo Pricing (cheaper alternative)
- Input: ~$0.0015 per 1K tokens
- Output: ~$0.002 per 1K tokens
- Average CV parse: ~$0.005-0.02 per CV

---

## Testing

After setting up your API key, test with:

```bash
# Test OpenAI connection
npx tsx scripts/test-openai-connection.ts

# Test CV parsing
npx tsx scripts/test-cv-parser.ts
```

---

## Support

If you continue having issues:

1. Check the logs in your terminal/Vercel
2. Verify API key has correct permissions
3. Check OpenAI service status: https://status.openai.com/
4. Review the error details in the improved logging

The system now provides detailed error messages to help diagnose issues!
