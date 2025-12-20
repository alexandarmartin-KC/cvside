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
 * Parse CV with text fallback (for when vision fails)
 * This uses the extracted text with GPT-4o in text mode
 */
export async function parseCVWithText(
  extractedText: string,
  apiKey: string
): Promise<ParsedCV> {
  const openai = new OpenAI({ apiKey });

  console.log('🔬 CV PARSER - Using GPT-4o (text mode)');
  console.log('📄 Text length:', extractedText.length, 'characters');

  const systemPrompt = `You are an expert CV/Resume parser. Analyze the CV text and extract structured information.

This is extracted text from a PDF, so the formatting might be broken. Do your best to identify sections and extract accurate information.

Return your response as valid JSON with this structure:
{
  "name": "Full Name",
  "name_confidence": "high/medium/low",
  "title": "Professional Title",
  "summary": "Professional summary...",
  "contact": {
    "email": "email@example.com",
    "phone": "+123456",
    "location": "City, Country",
    "linkedin": "https://linkedin.com/in/..."
  },
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "start_date": "2020",
      "end_date": "Present",
      "description": "Responsibilities...",
      "confidence": "high"
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "degree": "Degree Type",
      "field": "Field of Study",
      "start_date": "2015",
      "end_date": "2019",
      "confidence": "high"
    }
  ],
  "skills": ["Skill1", "Skill2"],
  "languages": ["Language1 (Level)", "Language2"]
}

Rules:
- Only extract clearly visible information
- Separate technical skills from spoken languages
- Use null for missing fields
- Return ONLY valid JSON`;

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
          content: `Parse this CV text:\n\n${extractedText.substring(0, 20000)}`
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
    console.log('✅ Successfully parsed CV with GPT-4o (text mode)');

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

  } catch (error: any) {
    console.error('❌ Text parsing with GPT-4o failed:', error.message);
    throw error;
  }
}
