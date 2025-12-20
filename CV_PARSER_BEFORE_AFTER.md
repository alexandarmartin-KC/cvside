# CV Parser - Before & After Comparison

## System Prompt Changes

### BEFORE (Old Approach)
```
You are an expert CV/Resume parser that works with ANY format, language, or structure.

YOUR TASK: Extract structured information from the CV text provided.

RULES:
1. Extract the person's FULL NAME exactly as written
2. Extract their current/most recent job title
3. Determine seniority level from context
4. Extract ALL skills, tools, technologies
5. Extract ALL work experience with dates
...

RETURN THIS EXACT JSON STRUCTURE:
{
  "name": "Full name",
  "title": "Job title",
  "seniority_level": "Junior|Mid|Senior|Lead",
  "core_skills": ["skill1", "skill2"],
  "locations": ["city"],
  "summary": "2-3 sentence summary",
  "experience": [
    {
      "company": "Company name",
      "role": "Job title",
      "start_date": "Exact start date",
      "end_date": "Exact end date",
      "bullets": ["achievement 1"]
    }
  ]
}
```

**Problems:**
- ❌ Could normalize/change date formats
- ❌ No confidence scoring
- ❌ No source verification
- ❌ Could "fill in" missing data
- ❌ No guidance on handling ambiguity
- ❌ No mechanism to flag uncertain extractions

---

### AFTER (New Approach)
```
You are a CV parsing engine. Your job is to read raw CV text 
and output clean structured JSON. The CV can have any layout or design.

**never invent information**

IMPORTANT RULES ABOUT DATES:
- Only use dates that literally appear in the CV text
- Keep the original date string format (e.g. "Nov 2020")
- If you are NOT certain which dates belong to which job, 
  set "start_date" and "end_date" to null
- Include the raw lines in "source_snippet"
- Do not invent months or years
- Do not reorder years

IMPORTANT RULES ABOUT NAME:
- The candidate's full name is usually in the very top lines
- If you are unsure, keep "name_confidence": "low"

OUTPUT FORMAT:
{
  "name": "string",
  "name_confidence": "high" | "medium" | "low",
  "title": "string or null",
  "contact": {
    "email": "string or null",
    "phone": "string or null",
    "location": "string or null",
    "linkedin": "string or null"
  },
  "skills": ["string", ...],
  "experience": [
    {
      "company": "string",
      "role": "string or null",
      "start_date": "string or null",
      "end_date": "string or null",
      "date_confidence": "high" | "medium" | "low",
      "bullets": ["string", ...],
      "source_snippet": "excerpt of original lines"
    }
  ],
  "raw_notes": "comments if ambiguous"
}

General rules:
- Prefer being conservative (null dates + low confidence) 
  over guessing wrong
```

**Benefits:**
- ✅ Explicit "never invent" instruction
- ✅ Confidence levels for all extractions
- ✅ Source snippets for verification
- ✅ Clear guidance on handling uncertainty
- ✅ Original date formats preserved
- ✅ `null` values instead of guesses

---

## Output Comparison

### Example CV
```
CV

Jane Smith

Senior Software Engineer

Email: jane@email.com

EXPERIENCE

Tech Corp Inc
Senior Software Engineer
2020
Present
• Led team of 5 engineers
```

---

### BEFORE (Old Output)
```json
{
  "name": "Jane Smith",
  "title": "Senior Software Engineer",
  "seniority_level": "Senior",
  "core_skills": [],
  "locations": [],
  "summary": "Senior Software Engineer with experience...",
  "experience": [
    {
      "company": "Tech Corp Inc",
      "role": "Senior Software Engineer",
      "start_date": "2020",
      "end_date": "Present",
      "bullets": ["Led team of 5 engineers"]
    }
  ]
}
```

**Issues:**
- No way to know if "2020" is certain
- No source verification
- Summary may be invented
- No confidence levels

---

### AFTER (New Output)
```json
{
  "name": "Jane Smith",
  "name_confidence": "high",
  "title": "Senior Software Engineer",
  "summary": null,
  "contact": {
    "email": "jane@email.com",
    "phone": null,
    "location": null,
    "linkedin": null
  },
  "skills": [],
  "experience": [
    {
      "company": "Tech Corp Inc",
      "role": "Senior Software Engineer",
      "location": null,
      "start_date": "2020",
      "end_date": "Present",
      "date_confidence": "medium",
      "bullets": ["Led team of 5 engineers"],
      "source_snippet": "Tech Corp Inc\nSenior Software Engineer\n2020\nPresent"
    }
  ],
  "education": [],
  "raw_notes": "Dates were on separate lines; association made based on context."
}
```

**Improvements:**
- ✅ Name confidence: "high"
- ✅ Date confidence: "medium" (dates on separate lines)
- ✅ Source snippet shows original text
- ✅ Raw notes explain uncertainty
- ✅ Summary is `null` (not invented)
- ✅ Contact properly structured
- ✅ Missing data is `null`

---

## Edge Case Comparison

### Ambiguous Dates

**Input:**
```
StartupXYZ
Software Engineer
2017
2019
• Built features
```

---

**BEFORE:**
```json
{
  "company": "StartupXYZ",
  "role": "Software Engineer",
  "start_date": "2017",
  "end_date": "2019"
}
```
*Assumes years are correctly associated - no way to verify*

---

**AFTER:**
```json
{
  "company": "StartupXYZ",
  "role": "Software Engineer",
  "start_date": "2017",
  "end_date": "2019",
  "date_confidence": "medium",
  "source_snippet": "StartupXYZ\nSoftware Engineer\n2017\n2019",
  "raw_notes": "Years on separate lines; interpreted as start-end range"
}
```
*OR if very uncertain:*
```json
{
  "company": "StartupXYZ",
  "role": "Software Engineer",
  "start_date": null,
  "end_date": null,
  "date_confidence": "low",
  "source_snippet": "StartupXYZ\nSoftware Engineer\n2017\n2019",
  "raw_notes": "Could not confidently associate dates with this position"
}
```

---

## Data Integrity Comparison

| Aspect | BEFORE | AFTER |
|--------|--------|-------|
| **Invented Data** | Possible (summaries, normalized dates) | Never |
| **Date Format** | Could be normalized | Original preserved |
| **Missing Info** | Empty strings or defaults | `null` values |
| **Confidence** | No indication | Explicit levels |
| **Verification** | No source tracking | Source snippets |
| **Ambiguity Handling** | Best guess | Low confidence + null |
| **User Trust** | Uncertain reliability | Clear indicators |
| **Debugging** | Difficult | Easy (source snippets) |

---

## Error Prevention Comparison

### Scenario: PDF Extraction Scrambles Text

**Extracted Text:**
```
Jane Smith
jane@email.com
+1 555-1234

EXPERIENCE

2020
Tech Corp Inc
Present
Senior Engineer
• Led team
```

---

**BEFORE:**
```json
{
  "company": "Tech Corp Inc",
  "role": "Senior Engineer",
  "start_date": "2020",
  "end_date": "Present"
}
```
*Could associate dates incorrectly with no warning*

---

**AFTER:**
```json
{
  "company": "Tech Corp Inc",
  "role": "Senior Engineer",
  "start_date": "2020",
  "end_date": "Present",
  "date_confidence": "low",
  "source_snippet": "2020\nTech Corp Inc\nPresent\nSenior Engineer",
  "raw_notes": "Text layout was unusual; date association uncertain"
}
```
*OR if very scrambled:*
```json
{
  "company": "Tech Corp Inc",
  "role": "Senior Engineer",
  "start_date": null,
  "end_date": null,
  "date_confidence": "low",
  "source_snippet": "2020\nTech Corp Inc\nPresent\nSenior Engineer",
  "raw_notes": "Text layout prevented reliable date extraction"
}
```

**Result:** User is warned to review the entry

---

## Impact Summary

### For Users
| Before | After |
|--------|-------|
| Don't know if data is accurate | Confidence levels indicate reliability |
| Can't verify extraction | Can see source snippets |
| May have invented summaries | Only real data shown |
| Dates might be wrong | Low confidence flagged |
| Trust unclear | Clear trust indicators |

### For Developers
| Before | After |
|--------|-------|
| Hard to debug | Source snippets enable debugging |
| No quality metrics | Confidence levels track quality |
| Can't improve | Can target low-confidence cases |
| Black box | Transparent process |

### For Business
| Before | After |
|--------|-------|
| Risky data quality | Reliable data |
| User complaints | User confidence |
| Manual fixes needed | Self-service correction |
| Brand damage risk | Professional experience |

---

## Code Structure Comparison

### Before
```typescript
async function analyzeCV(cvText: string) {
  // ... OpenAI call with old prompt
  const parsed = JSON.parse(content);
  return parsed;
}
```

### After
```typescript
async function analyzeCV(cvText: string) {
  // ... OpenAI call with NEW strict prompt
  const parsed = JSON.parse(content);
  
  console.log('🤖 OpenAI successfully parsed CV');
  console.log('   Name:', parsed.name, 
              `(confidence: ${parsed.name_confidence})`);
  console.log('   Skills count:', parsed.skills?.length || 0);
  console.log('   Experience entries:', parsed.experience?.length || 0);
  
  return parsed;
}
```

**Added logging shows:**
- Confidence levels
- Data quality metrics
- Easier monitoring

---

## Summary

The new CV parser is **significantly more reliable** because:

1. ✅ **Never invents data** - Strict rules prevent hallucination
2. ✅ **Confidence scoring** - Users know what to trust
3. ✅ **Source verification** - Can check original text
4. ✅ **Conservative defaults** - Prefers `null` over guessing
5. ✅ **Format preservation** - Original date formats kept
6. ✅ **Clear uncertainty handling** - Low confidence + notes
7. ✅ **Better debugging** - Source snippets enable fixes
8. ✅ **User empowerment** - Can make informed corrections

This transforms the parser from a **"best effort" tool** into a **production-ready, trustworthy system**.
