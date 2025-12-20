import OpenAI from 'openai';
import * as fs from 'fs';

async function testCVParser() {
  // Read sample CV
  const sampleCV = fs.readFileSync('/tmp/sample_cv.txt', 'utf-8');
  
  console.log('Testing CV Parser with sample CV...\n');
  console.log('CV Text (first 500 chars):');
  console.log(sampleCV.substring(0, 500));
  console.log('\n' + '='.repeat(80) + '\n');

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not set. Cannot test OpenAI parsing.');
    console.log('\nTesting fallback parser instead...\n');
    
    // Test the basic extraction logic
    const lines = sampleCV.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    // Find name
    let name = "";
    for (let i = 0; i < Math.min(10, lines.length); i++) {
      if (lines[i].match(/^CV$/i) && i + 1 < lines.length) {
        name = lines[i + 1];
        break;
      }
    }
    
    // Find email, phone
    const emailMatch = sampleCV.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    const phoneMatch = sampleCV.match(/(\+?\d{1,3}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/);
    
    console.log('Fallback Parser Results:');
    console.log('  Name:', name || 'Not found');
    console.log('  Email:', emailMatch ? emailMatch[0] : 'Not found');
    console.log('  Phone:', phoneMatch ? phoneMatch[0] : 'Not found');
    
    return;
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    console.log('Calling OpenAI API...\n');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a CV parsing engine. Your job is to read raw CV text and output clean structured JSON. The CV can have any layout or design.

The input is the FULL TEXT of a CV extracted from a PDF (line breaks preserved).
Sometimes the PDF extraction splits lines in strange ways, or moves dates onto separate lines from company names. Do your best to associate them correctly, but **never invent information**.

Your goals:
1. Identify the candidate's name.
2. Extract core profile info.
3. Extract work experience with correct date ranges, as reliably as possible.
4. Extract education.
5. DO NOT hallucinate missing data.

IMPORTANT RULES ABOUT DATES:
- Only use dates that literally appear in the CV text.
- Keep the original date string format (e.g. "Nov 2020", "11/2020", "November 2020").
- If you are NOT certain which dates belong to which job, set "start_date" and "end_date" to null for that job and include the raw lines in "source_snippet" so a human can fix it.
- Do not invent months or years that are not explicitly written.
- Do not reorder years (e.g. 2020–2022 must stay that way, never 2022–2020).

IMPORTANT RULES ABOUT NAME:
- The candidate's full name is usually in the very top lines.
- Ignore headers like "CV", "Curriculum Vitae", "Resume".
- If multiple names appear, choose the one that looks like a personal name, especially near contact info (email, phone).
- If you are unsure, pick your best guess and keep "name_confidence": "low".

OUTPUT FORMAT:
Return a single JSON object in this shape:

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

General rules:
- Do not include any text outside the JSON.
- If some sections are missing in the CV, return empty arrays for them.
- Prefer being conservative (null dates + low confidence) over guessing wrong.`
        },
        {
          role: 'user',
          content: `Parse this CV/Resume and extract all information:\n\n${sampleCV}`
        }
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    
    console.log('✅ Successfully parsed CV!\n');
    console.log('Parsed Results:');
    console.log(JSON.stringify(parsed, null, 2));
    
    console.log('\n' + '='.repeat(80));
    console.log('\nValidation:');
    console.log('  Name extracted:', parsed.name);
    console.log('  Name confidence:', parsed.name_confidence);
    console.log('  Title:', parsed.title);
    console.log('  Email:', parsed.contact?.email);
    console.log('  Phone:', parsed.contact?.phone);
    console.log('  Skills count:', parsed.skills?.length || 0);
    console.log('  Experience entries:', parsed.experience?.length || 0);
    console.log('  Education entries:', parsed.education?.length || 0);
    
    // Validate experience dates
    if (parsed.experience && parsed.experience.length > 0) {
      console.log('\nExperience Date Validation:');
      parsed.experience.forEach((exp: any, idx: number) => {
        console.log(`  ${idx + 1}. ${exp.company} (${exp.role})`);
        console.log(`     Dates: ${exp.start_date} - ${exp.end_date}`);
        console.log(`     Date confidence: ${exp.date_confidence}`);
        console.log(`     Source snippet: ${exp.source_snippet?.substring(0, 100)}...`);
      });
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testCVParser();
