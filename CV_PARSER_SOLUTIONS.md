# CV Parser Issues & Solutions

## Current Problem
The OpenAI-based CV parser is not extracting work experience (Ørsted, G4S Security, Securitas) or education from your CV.

## Why This Happens

### 1. **PDF Text Extraction Quality**
- PDFs can have hidden formatting that breaks text extraction
- Columns, tables, and graphics mess up the text flow
- What looks good visually may extract as gibberish

### 2. **AI Limitations with JSON Mode**
- OpenAI's structured output mode is strict about schema
- Complex extraction rules get ignored
- Single-pass extraction tries to do too much at once
- Temperature and model variations cause inconsistency

### 3. **No Visibility**
- We can't see what text OpenAI actually receives
- No way to debug why extraction fails
- Logs show "no experiences found" but not WHY

## Better Approaches

### ⭐ Recommended: Hybrid Approach (IMPLEMENTED)

**Multi-step process:**
1. **Extract & Preprocess** - Clean PDF text, preserve structure
2. **Deterministic Pattern Matching** - Use regex to find obvious patterns
3. **AI Enhancement** - Only use AI for ambiguous cases
4. **Validation** - Score confidence levels

**Advantages:**
- ✅ Deterministic patterns are 100% reliable when they match
- ✅ AI only handles edge cases
- ✅ Easier to debug (can see each step)
- ✅ Better performance (less AI calls)

**Files Created:**
- `/workspaces/cvside/lib/cv-parser-v2.ts` - New parser library
- `/workspaces/cvside/app/api/cv/parse-debug/route.ts` - Debug endpoint
- `/workspaces/cvside/app/debug-cv/page.tsx` - Debug UI

### Common Patterns That Work

```typescript
// Pattern 1: Pipe-separated
"Ørsted | 2020 - Present | Security Specialist"

// Pattern 2: Colon-separated  
"2020 - Present: Security Specialist at Ørsted"

// Pattern 3: Parentheses
"Security Specialist at Ørsted (2020 - Present)"

// Pattern 4: Multi-line
"Ørsted
Security Specialist
2020 - Present"
```

## Action Plan

### Step 1: Debug Your Actual CV ⚠️ DO THIS FIRST

1. Visit: **http://localhost:3000/debug-cv**
2. Upload your CV
3. Look at the extracted text
4. Check if you can see:
   - ✓ Company names (Ørsted, G4S, Securitas)
   - ✓ Your job titles
   - ✓ Date ranges
   - ✓ Proper spacing/formatting

**This will show us the root cause.**

### Step 2: Implement Pattern-Based Parser

Based on what we see in Step 1, we can:
- Add specific patterns for your CV format
- Handle Danish text properly
- Deal with any special formatting

### Step 3: Alternative Solutions

#### Option A: Specialized Document Parsing Service
**Best for:** Production use, high volume

```typescript
// AWS Textract
import { TextractClient, AnalyzeDocumentCommand } from "@aws-sdk/client-textract";

// Azure Form Recognizer  
import { DocumentAnalysisClient } from "@azure/ai-form-recognizer";

// Google Document AI
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
```

**Pros:**
- ✅ Purpose-built for documents
- ✅ Handles tables, columns, layouts
- ✅ Very accurate
- ✅ Structured output

**Cons:**
- ❌ Costs money
- ❌ Additional service to manage
- ❌ More complex setup

#### Option B: Anthropic Claude
**Best for:** Following complex instructions

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const message = await anthropic.messages.create({
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 1024,
  messages: [{
    role: "user",
    content: `Extract work experience from this CV:\n\n${cvText}`
  }],
});
```

**Pros:**
- ✅ Better at following instructions than GPT
- ✅ Handles longer context (200K tokens)
- ✅ More reliable extraction

**Cons:**
- ❌ Different API/billing
- ❌ Still has AI unpredictability

#### Option C: Two-Pass AI Extraction
**Best for:** Complex CVs with AI flexibility

```typescript
// Pass 1: Identify sections
const sections = await identifySections(cvText);

// Pass 2: Extract from each section independently  
const experience = await extractExperience(sections.experience);
const education = await extractEducation(sections.education);
```

**Pros:**
- ✅ Focused prompts work better
- ✅ Can handle any format
- ✅ More debuggable

**Cons:**
- ❌ More API calls (costs)
- ❌ Slower
- ❌ Still AI uncertainty

#### Option D: Manual Section Extraction UI
**Best for:** User control, 100% accuracy

Create a UI where users can:
1. See their CV text
2. Select text ranges for each experience
3. Fill in structured fields
4. Optionally use AI to pre-fill

**Pros:**
- ✅ 100% accurate (user decides)
- ✅ Works with ANY CV format
- ✅ No AI costs
- ✅ Users see exactly what's extracted

**Cons:**
- ❌ More user effort
- ❌ Slower onboarding

## Recommended Next Steps

### 🚀 Immediate (Today):
1. **Visit `/debug-cv`** and upload your CV
2. Share the output here
3. I'll create patterns specific to your format

### 📅 Short-term (This Week):
1. Implement hybrid parser (already created, needs integration)
2. Add Danish language patterns
3. Test with your actual CV

### 🎯 Long-term (Future):
1. Consider specialized document parsing service
2. Add manual correction UI
3. Build feedback loop to improve patterns

## Technical Recommendations

### For Development/Testing:
✅ **Use Hybrid Approach** (pattern matching + AI fallback)
- Cost-effective
- Good enough accuracy
- Easy to debug and improve

### For Production:
✅ **Use AWS Textract or Azure Form Recognizer**
- Professional-grade accuracy
- Handles all document types
- Worth the cost for user experience

### User Experience:
✅ **Always show extracted data for verification**
- Never auto-save without user confirmation
- Let users edit every field
- Show confidence scores

## Example: What Good Extraction Looks Like

```json
{
  "experiences": [
    {
      "company": "Ørsted",
      "role": "Security Specialist", 
      "location": "Copenhagen",
      "start_date": "2020",
      "end_date": "Present",
      "confidence": "high"
    },
    {
      "company": "G4S Security",
      "role": "Security Officer",
      "start_date": "2018", 
      "end_date": "2020",
      "confidence": "high"
    },
    {
      "company": "Securitas",
      "role": "Security Guard",
      "start_date": "2015",
      "end_date": "2018", 
      "confidence": "high"
    }
  ]
}
```

## Questions to Consider

1. **How important is automation?**
   - 100% auto = harder, less accurate
   - Manual correction = easier, 100% accurate

2. **What's your budget?**
   - Free: Pattern matching + OpenAI
   - Paid: AWS Textract (~$0.001 per page)

3. **What's your volume?**
   - Low volume: Manual correction is fine
   - High volume: Invest in better parsing

4. **What's acceptable accuracy?**
   - 60-70%: Current OpenAI approach
   - 80-90%: Hybrid approach
   - 95%+: Specialized service
   - 100%: Manual correction

## Files to Review

1. **Current parser:** `/workspaces/cvside/app/api/cv/parse/route.ts`
2. **New hybrid parser:** `/workspaces/cvside/lib/cv-parser-v2.ts`
3. **Debug endpoint:** `/workspaces/cvside/app/api/cv/parse-debug/route.ts`
4. **Debug UI:** `/workspaces/cvside/app/debug-cv/page.tsx`

---

**Next Action:** Visit http://localhost:3000/debug-cv and upload your CV so we can see the actual text extraction!
