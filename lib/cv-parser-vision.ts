/**
 * CV Parser using GPT-4o Vision
 * 
 * This version uses GPT-4o's vision capabilities to parse PDFs directly,
 * similar to how ChatGPT can understand your CV when you upload it.
 */

import OpenAI from 'openai';

interface ParsedCV {
  name: string | null;
  name_confidence: 'high' | 'medium' | 'low';
  title: string | null;
  summary: string | null;
  contact: {
    email: string | null;
    phone: string | null;
    location: string | null;
    linkedin: string | null;
  };
  experience: Array<{
    id: string;
    company: string;
    role: string;
    location?: string;
    start_date: string;
    end_date: string;
    description?: string;
    confidence: 'high' | 'medium' | 'low';
  }>;
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    field?: string;
    location?: string;
    start_date?: string;
    end_date?: string;
    confidence: 'high' | 'medium' | 'low';
  }>;
  skills: string[];
  languages: string[];
  seniority_level?: string;
  raw_notes?: string;
}

/**
 * Parse a CV using GPT-4o Vision
 * Converts PDF buffer to base64 images and uses vision API
 */
export async function parseCVWithVision(
  pdfBuffer: Buffer,
  apiKey: string
): Promise<ParsedCV> {
  const openai = new OpenAI({ apiKey });

  console.log('🔬 CV PARSER - Using GPT-4o Vision');
  console.log('📄 PDF buffer size:', pdfBuffer.length, 'bytes');

  // Convert PDF buffer to base64
  const base64Pdf = pdfBuffer.toString('base64');
  const dataUrl = `data:application/pdf;base64,${base64Pdf}`;

  const systemPrompt = `You are an expert CV/Resume parser. Analyze the uploaded CV and extract structured information.

IMPORTANT: This is a REAL CV that the user uploaded. Extract EXACTLY what you see - do not invent or guess information.

Extract the following fields:
1. **Personal Information**
   - name (full name as shown)
   - title (professional title/headline if present)
   - email, phone, location, linkedin URL

2. **Work Experience** (all jobs listed)
   - company name
   - job title/role
   - location (if shown)
   - start_date and end_date (format as "YYYY" or "YYYY-MM" or "Present")
   - description/responsibilities (bullet points as single paragraph)
   - For each job, assign a confidence level (high/medium/low)

3. **Education**
   - institution name
   - degree (e.g., "Bachelor of Science", "Master's")
   - field of study
   - location (if shown)
   - start_date and end_date (if shown)
   - confidence level

4. **Skills** 
   - Extract technical skills, tools, frameworks, programming languages
   - DO NOT include spoken languages here (e.g., English, Spanish)

5. **Languages** (spoken/written languages only)
   - Extract as array of strings like ["English", "Danish", "Spanish"]
   - If proficiency level is shown, include it: "English (Native)", "Spanish (Intermediate)"

6. **Summary** (if there's a professional summary/profile section)

Return your response as valid JSON matching this structure:
{
  "name": "John Doe",
  "name_confidence": "high",
  "title": "Senior Software Engineer",
  "summary": "Experienced developer...",
  "contact": {
    "email": "john@example.com",
    "phone": "+1234567890",
    "location": "Copenhagen, Denmark",
    "linkedin": "https://linkedin.com/in/johndoe"
  },
  "experience": [
    {
      "company": "TechCorp",
      "role": "Senior Developer",
      "location": "Copenhagen",
      "start_date": "2020-01",
      "end_date": "Present",
      "description": "Led development of...",
      "confidence": "high"
    }
  ],
  "education": [
    {
      "institution": "University of Copenhagen",
      "degree": "Master of Science",
      "field": "Computer Science",
      "location": "Copenhagen",
      "start_date": "2015",
      "end_date": "2017",
      "confidence": "high"
    }
  ],
  "skills": ["JavaScript", "React", "Python", "AWS"],
  "languages": ["English (Native)", "Danish (Fluent)", "German (Basic)"]
}

Rules:
- Only extract what is CLEARLY visible in the CV
- If a field is not present, use null or empty array
- Confidence levels: high = clearly stated, medium = inferred from context, low = uncertain
- Ensure all dates are consistent (prefer YYYY or YYYY-MM format)
- Return ONLY valid JSON, no additional text`;

  try {
    // Try GPT-4o (the latest model with vision)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Please analyze this CV and extract all relevant information. Return the response as JSON.'
            },
            {
              type: 'image_url',
              image_url: {
                url: dataUrl,
                detail: 'high' // Use high detail for better accuracy
              }
            }
          ]
        }
      ],
      temperature: 0,
      max_tokens: 4096,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    console.log('✅ Successfully parsed CV with GPT-4o Vision');
    console.log('   Name:', parsed.name || 'Not found');
    console.log('   Experience entries:', parsed.experience?.length || 0);
    console.log('   Education entries:', parsed.education?.length || 0);
    console.log('   Skills:', parsed.skills?.length || 0);

    // Add IDs to experience and education if not present
    if (parsed.experience) {
      parsed.experience = parsed.experience.map((exp: any, idx: number) => ({
        ...exp,
        id: exp.id || `exp_${idx + 1}`
      }));
    }

    if (parsed.education) {
      parsed.education = parsed.education.map((edu: any, idx: number) => ({
        ...edu,
        id: edu.id || `edu_${idx + 1}`
      }));
    }

    return parsed as ParsedCV;

  } catch (error: any) {
    console.error('❌ Vision parsing failed:', error.message);
    
    // Check if it's a model availability issue
    if (error?.status === 404 || error?.message?.includes('model') || error?.message?.includes('gpt-4o')) {
      console.log('⚠️ GPT-4o not available, trying GPT-4-vision-preview...');
      
      try {
        const fallbackCompletion = await openai.chat.completions.create({
          model: 'gpt-4-vision-preview',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Please analyze this CV and extract all relevant information. Return the response as JSON.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: dataUrl,
                    detail: 'high'
                  }
                }
              ]
            }
          ],
          temperature: 0,
          max_tokens: 4096
        });

        const content = fallbackCompletion.choices[0]?.message?.content;
        if (!content) {
          throw new Error('No response from fallback model');
        }

        // Try to extract JSON from response (might have markdown formatting)
        let jsonStr = content;
        const jsonMatch = content.match(/```json\n?(.*?)\n?```/s);
        if (jsonMatch) {
          jsonStr = jsonMatch[1];
        }

        const parsed = JSON.parse(jsonStr);
        console.log('✅ Successfully parsed CV with GPT-4-vision-preview');

        // Add IDs
        if (parsed.experience) {
          parsed.experience = parsed.experience.map((exp: any, idx: number) => ({
            ...exp,
            id: exp.id || `exp_${idx + 1}`
          }));
        }

        if (parsed.education) {
          parsed.education = parsed.education.map((edu: any, idx: number) => ({
            ...edu,
            id: edu.id || `edu_${idx + 1}`
          }));
        }

        return parsed as ParsedCV;

      } catch (fallbackError: any) {
        console.error('❌ Fallback model also failed:', fallbackError.message);
        throw fallbackError;
      }
    }
    
    throw error;
  }
}

/**
 * Parse CV with text (using GPT-4o)
 * This uses the extracted text with GPT-4o's advanced understanding
 */
export async function parseCVWithText(
  extractedText: string,
  apiKey: string
): Promise<ParsedCV> {
  const openai = new OpenAI({ apiKey });

  console.log('🔬 CV PARSER - Using GPT-4o');
  console.log('📄 Text length:', extractedText.length, 'characters');

  const systemPrompt = `You are an expert CV/Resume parser with deep understanding of professional documents.

Your task: Extract ALL information from this CV comprehensively and accurately.

CRITICAL RULES:
1. Extract EVERYTHING you see - be thorough
2. Do NOT skip any work experience or education entries
3. Do NOT invent information that isn't present
4. If formatting is messy, use context to understand structure
5. Return complete, detailed information

OUTPUT FORMAT (JSON):
{
  "name": "Full Name",
  "name_confidence": "high|medium|low",
  "title": "Professional Title or Role",
  "summary": "Professional summary if present",
  "contact": {
    "email": "email@example.com",
    "phone": "+1234567890",
    "location": "City, Country",
    "linkedin": "https://linkedin.com/in/..."
  },
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "location": "City, Country",
      "start_date": "YYYY-MM or YYYY",
      "end_date": "YYYY-MM or YYYY or Present",
      "bullets": [
        "First responsibility or achievement",
        "Second responsibility or achievement",
        "Third responsibility or achievement"
      ],
      "confidence": "high"
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "degree": "Degree Type (Bachelor, Master, PhD, etc.)",
      "field": "Field of Study",
      "location": "City, Country",
      "start_date": "YYYY",
      "end_date": "YYYY",
      "confidence": "high"
    }
  ],
  "skills": ["Skill1", "Skill2", "Skill3"],
  "languages": ["English (Native)", "Spanish (Fluent)"],
  "seniority_level": "Junior|Mid|Senior|Lead|Principal"
}

EXTRACTION GUIDELINES:

**Personal Info:**
- Name: Usually at the top, largest text
- Title: Often right after name (e.g., "Senior Developer", "Product Manager")
- Contact: Email, phone, location usually in header
- LinkedIn: Look for linkedin.com URLs

**Experience:**
- Look for: "Experience", "Work History", "Employment", "Professional Experience"
- Common patterns: Company | Role | Dates | Location
- Extract ALL jobs, even if formatting is inconsistent
- Dates format: Try to standardize to YYYY-MM or YYYY
- Bullets: Extract ALL bullet points, responsibilities, and achievements as separate array items
- IMPORTANT: Return bullets as an array, not a single description string
- Each bullet should be a separate achievement, responsibility, or project
- If you see responsibilities, achievements, or bullet points - include them ALL

**Education:**
- Look for: "Education", "Academic Background", "Qualifications"
- Extract: Institution, Degree type, Field, Dates
- Common degrees: Bachelor, Master, PhD, Diploma, Certificate

**Skills:**
- Look for: "Skills", "Technical Skills", "Core Competencies", "Technologies"
- Extract: Programming languages, frameworks, tools, methodologies
- DO NOT include spoken languages (those go in "languages" field)
- Examples: JavaScript, Python, React, AWS, Agile, Docker

**Languages (Spoken):**
- Look for: "Languages", "Language Skills"
- Extract spoken/written languages only
- Include proficiency if mentioned: "English (Native)", "French (Intermediate)"
- Examples: English, Spanish, German, Mandarin, Danish

**Seniority Level:**
- Determine from job titles and experience years
- Junior: 0-2 years, entry-level roles
- Mid: 3-5 years, standard roles
- Senior: 6+ years, senior titles
- Lead/Principal: Leadership roles, 10+ years

IMPORTANT NOTES:
- The text might be messy due to PDF extraction
- Use context clues to identify sections
- Dates might be separated from job titles
- Multi-column layouts get merged together
- Look for common section headers even if formatted oddly
- Extract company names even if formatting is inconsistent

Return ONLY valid JSON, no additional text or markdown formatting.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Parse this CV completely and thoroughly. Extract ALL information:\n\n${extractedText.substring(0, 30000)}`
        }
      ],
      temperature: 0,
      max_tokens: 4096,
      response_format: { type: 'json_object' }
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    console.log('✅ Successfully parsed CV with GPT-4o');
    console.log('   Name:', parsed.name || 'Not found');
    console.log('   Title:', parsed.title || 'Not found');
    console.log('   Experience entries:', parsed.experience?.length || 0);
    console.log('   Education entries:', parsed.education?.length || 0);
    console.log('   Skills:', parsed.skills?.length || 0);
    console.log('   Languages:', parsed.languages?.length || 0);

    // Add IDs and convert description to bullets
    if (parsed.experience) {
      parsed.experience = parsed.experience.map((exp: any, idx: number) => {
        // Convert description string to bullets array if needed
        let bullets = exp.bullets || [];
        if (exp.description && !exp.bullets) {
          // Split description into bullet points
          bullets = exp.description
            .split(/[\n\r]+/)
            .map((line: string) => line.trim())
            .filter((line: string) => line.length > 0 && line !== '-');
        }
        
        return {
          ...exp,
          id: exp.id || `exp_${idx + 1}`,
          bullets: bullets.length > 0 ? bullets : undefined
        };
      });
    }

    if (parsed.education) {
      parsed.education = parsed.education.map((edu: any, idx: number) => ({
        ...edu,
        id: edu.id || `edu_${idx + 1}`
      }));
    }

    // Ensure seniority_level is set
    if (!parsed.seniority_level && parsed.experience?.length > 0) {
      // Estimate from experience
      const years = parsed.experience.length;
      parsed.seniority_level = years >= 6 ? 'Senior' : years >= 3 ? 'Mid' : 'Junior';
    }

    return parsed as ParsedCV;

  } catch (error: any) {
    console.error('❌ GPT-4o parsing failed:', error.message);
    throw error;
  }
}
