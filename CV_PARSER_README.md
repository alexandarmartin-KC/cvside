# CV Parser Documentation

## Overview

The CV parser is designed to extract structured information from raw CV/resume text with **strict rules to prevent hallucination**. It can handle any CV layout or format and works in multiple languages.

## Core Principles

1. **Never invent information** - Only extract data that literally appears in the CV
2. **Conservative over wrong** - Use `null` values and low confidence when uncertain
3. **Preserve original formats** - Keep date formats exactly as written (e.g., "Nov 2020", "11/2020")
4. **Include source snippets** - Provide original text for verification

## API Endpoint

**POST** `/api/cv/parse`

### Request

- **Content-Type**: `multipart/form-data`
- **Body**: 
  - `file`: PDF file (max 4MB)

### Response Structure

```json
{
  "name": "string",
  "name_confidence": "high" | "medium" | "low",
  "title": "string or null",
  "summary": "string or null",
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
      "location": "string or null",
      "start_date": "string or null",
      "end_date": "string or null",
      "date_confidence": "high" | "medium" | "low",
      "bullets": ["string", ...],
      "source_snippet": "short excerpt of the original lines for this job"
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string or null",
      "field": "string or null",
      "start_date": "string or null",
      "end_date": "string or null",
      "details": ["string", ...],
      "source_snippet": "short excerpt of the original lines for this education"
    }
  ],
  "raw_notes": "optional comments if something was ambiguous"
}
```

## Parsing Rules

### Name Extraction

- **Location**: Usually in the very top lines of the CV
- **Filtering**: Ignores headers like "CV", "Curriculum Vitae", "Resume"
- **Selection**: Prefers names near contact info (email, phone)
- **Confidence Levels**:
  - `high`: Clear personal name with 2+ words, no special indicators
  - `medium`: Likely name but some uncertainty
  - `low`: Multiple possibilities or unclear

### Date Extraction

**Critical Rules:**

1. **Only use literal dates** from the CV text
2. **Preserve format** exactly as written:
   - ✅ "Nov 2020", "11/2020", "November 2020" 
   - ✅ "2020 - 2022", "Jan 2020 - Present"
   - ❌ DO NOT convert or normalize formats
3. **Handle uncertainty**:
   - If dates are on separate lines from company names, try to associate them
   - If uncertain, set `start_date` and `end_date` to `null`
   - Include the problematic text in `source_snippet`
4. **Never invent** months or years
5. **Never reorder** (e.g., 2020–2022 must stay that way, not 2022–2020)

### Date Confidence Levels

- `high`: Dates are clearly associated with this specific job
- `medium`: Dates likely belong to this job but formatting was ambiguous
- `low`: Dates could not be confidently associated (set dates to `null`)

### Experience Extraction

For each work experience entry:

```json
{
  "company": "Required - company name",
  "role": "Job title or null if not found",
  "location": "City/location or null",
  "start_date": "Original format or null if uncertain",
  "end_date": "Original format or null if uncertain",
  "date_confidence": "high | medium | low",
  "bullets": ["Achievement 1", "Responsibility 2"],
  "source_snippet": "Tech Corp Inc\nSenior Engineer\nJan 2020 - Present"
}
```

**Source Snippet Purpose:**
- Provides original context for verification
- Allows humans to fix incorrect date associations
- Shows what the parser "saw" in the CV

### Education Extraction

Similar structure to experience:

```json
{
  "institution": "School/university name",
  "degree": "e.g., Bachelor of Science, MBA, PhD, or null",
  "field": "e.g., Computer Science, Business, or null",
  "start_date": "Original format or null",
  "end_date": "Original format or null",
  "details": ["GPA: 3.8", "Minor in Mathematics"],
  "source_snippet": "Stanford University\nMaster of Science\n2013 - 2015"
}
```

### Skills Extraction

- Extract ALL mentioned: technologies, tools, certifications, languages
- Keep original capitalization: "JavaScript" not "javascript"
- Include: programming languages, frameworks, tools, soft skills, certifications

### Contact Information

- **Email**: Regex pattern matching
- **Phone**: International formats supported (+1, +44, etc.)
- **LinkedIn**: Extracts `linkedin.com/in/username` patterns
- **Location**: City/country mentioned (typically near header)

## Implementation Details

### Two-Tier Parsing Strategy

1. **OpenAI Parsing** (when `OPENAI_API_KEY` is set)
   - Uses GPT-4 with strict system prompt
   - Follows all rules above
   - Returns structured JSON matching the schema
   - Handles complex layouts and multiple languages

2. **Fallback Parser** (when OpenAI unavailable)
   - Uses regex and heuristics
   - Extracts: name, title, contact info, skills
   - **Note**: Does not extract experience/education (too complex)
   - Sets `raw_notes` to indicate fallback was used

### Code Location

- Main route: [`app/api/cv/parse/route.ts`](app/api/cv/parse/route.ts)
- Function: `analyzeCV()` - OpenAI-based parser
- Function: `extractBasicInfoFromText()` - Fallback parser

## Testing

### Test Script

Run the test script to verify parsing:

```bash
npx tsx scripts/test-cv-parser.ts
```

### Sample CV Format

```
CV

Jane Smith

Senior Software Engineer

Email: jane.smith@email.com
Phone: +1 555-123-4567
LinkedIn: linkedin.com/in/janesmith
Location: San Francisco, CA

PROFESSIONAL SUMMARY
...

SKILLS
JavaScript, TypeScript, React...

WORK EXPERIENCE

Tech Corp Inc
Senior Software Engineer
San Francisco, CA
Jan 2020 - Present
• Achievement 1
• Achievement 2

EDUCATION

Stanford University
Master of Science
Computer Science
2013 - 2015
```

## Common Edge Cases

### 1. Dates on Separate Lines

**Input:**
```
Tech Corp Inc
Senior Engineer
2020
2022
```

**Handling:**
- Parser attempts to associate dates with job
- If uncertain, sets `start_date: null`, `end_date: null`
- Includes raw text in `source_snippet`
- Sets `date_confidence: "low"`

### 2. Present/Current Employment

**Variations:**
- English: "Present", "Current", "Now"
- Danish: "Nuværende"
- German: "Aktuell"

**Rule:** Keep the original word exactly as written

### 3. Multiple Name Candidates

**Strategy:**
1. Look for name after "CV" header
2. Look near contact information
3. Choose 2-4 word capitalized phrases
4. Set `name_confidence` based on certainty

### 4. Creative CV Layouts

**Challenges:**
- Two-column designs
- Text blocks split oddly by PDF extraction
- Dates separated from company names

**Mitigation:**
- AI model handles complex layouts better
- Fallback parser uses multiple strategies
- Always provide `source_snippet` for verification

## Environment Variables

```bash
# Optional - enables AI-powered parsing
OPENAI_API_KEY=sk-...
```

**Without OpenAI:**
- Basic info only (name, title, skills, contact)
- Experience and education not extracted
- User can still upload CV for manual entry

## Integration with Application

After parsing, the data is:

1. **Stored**: In database via `/api/cv/save-profile`
2. **Displayed**: User can review/edit on profile page
3. **Used**: For job matching and recommendations
4. **Editable**: User can correct any mistakes

## Future Improvements

- [ ] Multi-language date parsing (Danish, German, French formats)
- [ ] Better experience/education extraction in fallback mode
- [ ] Date normalization option (for sorting/filtering)
- [ ] Confidence scoring for all extracted fields
- [ ] Support for additional CV formats (Word, plain text)

## Security & Privacy

- Files limited to 4MB
- Only PDFs accepted
- Text extracted server-side
- No CV data sent to third parties (except OpenAI if configured)
- User controls all data via profile settings
