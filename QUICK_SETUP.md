# Quick Setup Guide

## Step 1: Add Your OpenAI API Key

1. **Get an API key:**
   - Go to https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Copy the key (starts with `sk-proj-...`)

2. **Add it to `.env.local`:**
   ```bash
   # Edit this file
   nano .env.local
   
   # Or use VS Code
   code .env.local
   ```

3. **Replace the placeholder:**
   ```env
   OPENAI_API_KEY=sk-proj-your-actual-key-here
   ```

4. **Save the file**

## Step 2: Restart the Development Server

```bash
# Stop the current server (Ctrl+C if running)
# Then restart:
npm run dev
```

## Step 3: Test Your CV

**Option A: Upload and Test**
1. Go to http://localhost:3000/upload
2. Upload your CV
3. Watch the terminal logs for extraction details

**Option B: Debug First (Recommended)**
1. Go to http://localhost:3000/debug-cv
2. Upload your CV
3. See exactly what text is extracted
4. Verify company names (Ørsted, G4S, Securitas) are visible

## What to Look For in Logs

When you upload a CV, you should see:

```
🔬 HYBRID CV PARSER - Starting analysis
📄 CV text length: XXXX characters

🔍 STEP 1: Preprocessing CV text...
   ✓ Detected sections: ...

🎯 STEP 2: Pattern-based extraction...
   1. [Role] at [Company] ([Start] - [End])
   OR
   ⚠️ No standard patterns found, trying intelligent detection...
   🔍 Intelligent detection: [Role] at [Company]

🤖 STEP 3: AI enhancement...
   ✓ AI extracted basic info
      Name: [Your Name]
      Skills: X
      Languages: Y

✅ FINAL PARSED PROFILE:
   Experience entries: X
```

## If Experience Still Not Extracted

The intelligent parser now looks for:
- ✅ Known Danish companies: Ørsted, G4S, Securitas, ISS, Falck, etc.
- ✅ Company mentions in context: "hos Ørsted", "for G4S", "ved Securitas"
- ✅ Danish job titles: specialist, ansvarlig, leder, vagt, etc.
- ✅ Nearby dates (searches ±5 lines around company mentions)

**If you see:**
```
   🔍 Intelligent detection: Sikkerhedsansvarlig at Ørsted (2020 - Present)
```

Then it's working!

## Troubleshooting

### Problem: "OPENAI_API_KEY not set"
**Solution:** Make sure `.env.local` exists and has your API key

### Problem: "experience: []" (empty array)
**Solutions:**
1. Check `/debug-cv` - are company names visible in extracted text?
2. If text is garbled, PDF quality is the issue (needs OCR or better extraction)
3. Share the debug output - I can add specific patterns for your CV

### Problem: Weird line breaks in extracted text
**Example:** `"Ørsted  |  2020  -  Present  |  Security"`
**Solution:** This is a PDF extraction quality issue. Options:
- Try re-saving your PDF (File → Save As)
- Use AWS Textract for better extraction (I can add this)
- Use Azure Form Recognizer

## Next Steps After Setup

1. **Upload your CV** and check if experiences are extracted
2. **If not working:** Go to `/debug-cv` and share the output
3. **If working:** Save your profile and test job matching!

## Cost Estimate

- **OpenAI API usage per CV:**
  - Pattern matching: $0 (free, deterministic)
  - Basic info extraction: ~$0.01-0.02 per CV
  - Job matching: ~$0.01-0.03 per CV
  - **Total: ~$0.02-0.05 per CV upload**

## Alternative: Use Anthropic Claude

If OpenAI doesn't work well, you can switch to Claude:

1. Get Claude API key from https://console.anthropic.com/
2. Add to `.env.local`:
   ```env
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```
3. I'll update the parser to use Claude instead

---

**Ready to test? Add your API key and restart the server!**
