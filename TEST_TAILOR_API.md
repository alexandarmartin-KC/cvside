# CV Tailoring API - Test Guide

## Endpoint
`POST /api/cv/tailor`

## Authentication
Requires valid session (user must be logged in)

## Request Body
```json
{
  "jobId": "clxxxxx...",
  "userNotes": "Optional notes about tailoring preferences"
}
```

## Response Structure
```json
{
  "tailored_cv": {
    "name": "string",
    "title": "string",
    "summary": "string",
    "skills": ["array", "of", "skills"],
    "experience": [
      {
        "title": "string",
        "company": "string",
        "location": "string",
        "duration": "string",
        "bullets": ["achievement 1", "achievement 2"]
      }
    ],
    "education": [],
    "certifications": [],
    "projects": []
  },
  "design_options": {
    "templates": [
      {
        "id": "classic-clean",
        "display_name": "Classic Clean",
        "description": "Simple single-column layout...",
        "strengths": ["Maximum ATS compatibility", "..."]
      }
    ],
    "colors": [
      {
        "id": "neutral-black",
        "name": "Neutral Black",
        "hex": "#000000"
      }
    ],
    "photo_option": {
      "enabled": false,
      "recommended_size": "120px",
      "shape": "circle"
    }
  },
  "designer_panel_ui": {
    "panel_title": "Style Your Tailored CV",
    "sections": [...],
    "actions": ["Save CV Version", "Download PDF", ...]
  },
  "instructions_for_user_editing": "All sections are editable..."
}
```

## Testing with curl

### 1. First, log in and get session cookie
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}' \
  -c cookies.txt
```

### 2. Get a job ID (from saved/matched jobs)
```bash
curl -X GET http://localhost:3000/api/dashboard/jobs/saved \
  -b cookies.txt
```

### 3. Call tailor endpoint
```bash
curl -X POST http://localhost:3000/api/cv/tailor \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "jobId": "YOUR_JOB_ID_HERE",
    "userNotes": "Focus on leadership skills"
  }'
```

## Prerequisites
1. User must have uploaded a CV (CV profile exists)
2. Job must exist in database (can use mock jobs from seed)
3. OPENAI_API_KEY must be set in environment (or fallback will be used)

## Error Responses

### 401 Unauthorized
```json
{ "error": "Unauthorized" }
```

### 400 Bad Request (missing CV)
```json
{ "error": "No CV profile found. Please upload a CV first." }
```

### 404 Not Found (job doesn't exist)
```json
{ "error": "Job not found" }
```

## Next Steps
- Create frontend UI at `/app/dashboard/tailor/[jobId]/page.tsx`
- Build CV editor component
- Add PDF/DOCX export functionality
- Store tailored CV versions in database
