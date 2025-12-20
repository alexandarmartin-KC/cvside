# CV Parser - Edge Cases & Examples

This document demonstrates how the CV parser handles various challenging scenarios.

## Edge Case Examples

### 1. Special Characters in Names

**Input:**
```
CV
John Müller-Schmidt
```

**Output:**
```json
{
  "name": "John Müller-Schmidt",
  "name_confidence": "high"
}
```

**Note:** Preserves all special characters (ü, ø, å, é, etc.)

---

### 2. Dates on Separate Lines

**Input:**
```
G4S Danmark A/S
Security Operations Manager
København
2021
Nuværende
• Responsible for operations
```

**Scenario A - Parser is confident:**
```json
{
  "company": "G4S Danmark A/S",
  "role": "Security Operations Manager",
  "location": "København",
  "start_date": "2021",
  "end_date": "Nuværende",
  "date_confidence": "high",
  "source_snippet": "G4S Danmark A/S\nSecurity Operations Manager\nKøbenhagen\n2021\nNuværende"
}
```

**Scenario B - Parser is uncertain:**
```json
{
  "company": "G4S Danmark A/S",
  "role": "Security Operations Manager",
  "location": "København",
  "start_date": null,
  "end_date": null,
  "date_confidence": "low",
  "source_snippet": "G4S Danmark A/S\nSecurity Operations Manager\nKøbenhagen\n2021\nNuværende",
  "raw_notes": "Dates could not be confidently associated with this position"
}
```

---

### 3. Multiple Date Formats

The parser preserves the **original format** exactly:

**Input Examples:**
```
Jan 2020 - Present
January 2020 - Present
01/2020 - 12/2022
2020 - 2022
Mar 2019 - Aug 2021
March 2019 - August 2021
2021 - Nuværende  (Danish)
2020 - Aktuell    (German)
```

**Output:** Each date string is kept exactly as written

```json
{
  "start_date": "March 2019",
  "end_date": "August 2021"
}
```

**Why?** Different CV formats use different conventions. The system doesn't normalize because:
- Original format may be culturally significant
- Prevents errors from date conversion
- Human can see exactly what was in the CV

---

### 4. Ambiguous Company/Role Order

**Input:**
```
Senior Software Engineer
Tech Corp Inc
San Francisco
2020 - 2022
```

**Parser Strategy:**
1. Look for company indicators (Inc, Ltd, GmbH, A/S, ApS, Corp)
2. Look for role indicators (Senior, Engineer, Manager, Consultant)
3. Examine capitalization patterns
4. Check position in text block

**Output:**
```json
{
  "company": "Tech Corp Inc",
  "role": "Senior Software Engineer",
  "location": "San Francisco",
  "start_date": "2020",
  "end_date": "2022",
  "date_confidence": "high"
}
```

---

### 5. Missing Information

**Input:**
```
Tech Startup
2020 - 2021
• Built features
• Fixed bugs
```

**Output:**
```json
{
  "company": "Tech Startup",
  "role": null,
  "location": null,
  "start_date": "2020",
  "end_date": "2021",
  "date_confidence": "high",
  "bullets": [
    "Built features",
    "Fixed bugs"
  ]
}
```

**Note:** Uses `null` for missing data, never invents information

---

### 6. Multiple Possible Names

**Input:**
```
CV
Senior Security Specialist
John Smith
Copenhagen, Denmark
Email: john@example.com
```

**Parser Logic:**
1. Skip "CV" (header)
2. Skip "Senior Security Specialist" (job title indicators)
3. Choose "John Smith" (near contact info)

**Output:**
```json
{
  "name": "John Smith",
  "name_confidence": "high",
  "title": "Senior Security Specialist"
}
```

---

### 7. Non-English CVs

**Danish Example:**

**Input:**
```
CV

Lars Hansen

Sikkerhedsleder

Email: lars@example.dk
Mobil: +45 12 34 56 78

ERHVERVSERFARING

G4S Danmark A/S
Sikkerhedsleder
København
2020 - Nuværende
• Ansvarlig for sikkerhed
• Koordinering af teamet
```

**Output:**
```json
{
  "name": "Lars Hansen",
  "name_confidence": "high",
  "title": "Sikkerhedsleder",
  "contact": {
    "email": "lars@example.dk",
    "phone": "+45 12 34 56 78",
    "location": "København",
    "linkedin": null
  },
  "experience": [
    {
      "company": "G4S Danmark A/S",
      "role": "Sikkerhedsleder",
      "location": "København",
      "start_date": "2020",
      "end_date": "Nuværende",
      "date_confidence": "high",
      "bullets": [
        "Ansvarlig for sikkerhed",
        "Koordinering af teamet"
      ]
    }
  ]
}
```

**Note:** All original text preserved, no translation

---

### 8. Creative/Unusual Layouts

**Two-Column CV (PDF extraction may scramble):**

**Extracted Text:**
```
Jane Smith              Email: jane@example.com
Senior Engineer         Phone: +1 555-1234
                        San Francisco, CA

SKILLS                  EXPERIENCE
JavaScript              Tech Corp (2020-Present)
Python                  Senior Engineer
React                   • Led team of 5
AWS                     • Built microservices
```

**Challenge:** Text order is unpredictable

**Parser Strategy:**
- OpenAI model uses context to associate pieces
- Looks for patterns (company indicators, date formats)
- Falls back to conservative approach when uncertain

**Output:**
```json
{
  "name": "Jane Smith",
  "name_confidence": "high",
  "title": "Senior Engineer",
  "contact": {
    "email": "jane@example.com",
    "phone": "+1 555-1234",
    "location": "San Francisco, CA"
  },
  "skills": ["JavaScript", "Python", "React", "AWS"],
  "experience": [
    {
      "company": "Tech Corp",
      "role": "Senior Engineer",
      "start_date": "2020",
      "end_date": "Present",
      "date_confidence": "medium",
      "bullets": ["Led team of 5", "Built microservices"],
      "source_snippet": "Tech Corp (2020-Present)\nSenior Engineer\n• Led team of 5\n• Built microservices"
    }
  ]
}
```

---

### 9. Certifications as Title

**Input:**
```
CV

Maria Rodriguez

CFPA, CISSP, PMP

Email: maria@example.com
```

**Parser Logic:**
- Recognizes certification patterns (CFPA, CISSP, PMP, MBA, PhD)
- Can use as title if no other title found
- May extract to both title and skills

**Output:**
```json
{
  "name": "Maria Rodriguez",
  "name_confidence": "high",
  "title": "CFPA, CISSP, PMP",
  "skills": ["CFPA", "CISSP", "PMP"],
  "contact": {
    "email": "maria@example.com"
  }
}
```

---

### 10. Minimal Information CV

**Input:**
```
John Doe
john@example.com

Software Developer

Skills: JavaScript, Python, React

Tech Corp - 2020 to 2022
StartupXYZ - 2018 to 2020
```

**Output:**
```json
{
  "name": "John Doe",
  "name_confidence": "high",
  "title": "Software Developer",
  "contact": {
    "email": "john@example.com",
    "phone": null,
    "location": null,
    "linkedin": null
  },
  "skills": ["JavaScript", "Python", "React"],
  "experience": [
    {
      "company": "Tech Corp",
      "role": null,
      "location": null,
      "start_date": "2020",
      "end_date": "2022",
      "date_confidence": "high",
      "bullets": [],
      "source_snippet": "Tech Corp - 2020 to 2022"
    },
    {
      "company": "StartupXYZ",
      "role": null,
      "location": null,
      "start_date": "2018",
      "end_date": "2020",
      "date_confidence": "high",
      "bullets": [],
      "source_snippet": "StartupXYZ - 2018 to 2020"
    }
  ],
  "education": [],
  "raw_notes": null
}
```

---

## Confidence Level Guidelines

### Name Confidence

- **High**: 
  - Clear personal name (2-4 words)
  - No special indicators
  - Near contact information
  - Matches cultural naming patterns

- **Medium**:
  - Multiple name candidates
  - Unusual formatting
  - Far from contact info

- **Low**:
  - Very uncertain
  - Multiple equally likely options
  - "Unknown" used as fallback

### Date Confidence

- **High**:
  - Dates clearly on same line or immediately adjacent to job
  - Standard format (Month Year - Month Year)
  - Unambiguous association

- **Medium**:
  - Dates on separate lines but context is clear
  - Some formatting ambiguity
  - Multiple jobs with dates nearby

- **Low**:
  - Cannot determine which dates belong to which job
  - Conflicting information
  - Dates set to `null` in this case

---

## Testing Edge Cases

To test edge cases:

1. Create a sample CV file with the edge case
2. Run: `npx tsx scripts/test-cv-parser.ts`
3. Review the output JSON
4. Check confidence levels and source snippets

---

## Handling Parser Errors

If the parser produces incorrect results:

1. **Check source_snippet**: Shows what the parser "saw"
2. **Check confidence levels**: Low confidence = needs review
3. **Verify dates**: If `date_confidence` is low, dates may be `null`
4. **Review raw_notes**: May contain helpful information

The application allows users to **edit all parsed data**, so errors can be corrected manually.
