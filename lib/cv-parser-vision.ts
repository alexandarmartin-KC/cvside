/**
 * CV Parser using GPT-4o with native PDF support
 * 
 * This uses OpenAI's file upload capability where GPT-4o can read PDFs directly,
 * exactly like ChatGPT does when you upload a PDF.
 */

import OpenAI from 'openai';
import { toFile } from 'openai/uploads';

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
    bullets?: string[];
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
 * Parse a CV by uploading the PDF directly to OpenAI
 * This allows GPT-4o to read the PDF natively with full structure preservation
 */
export async function parseCVWithDirectUpload(
  pdfBuffer: Buffer,
  apiKey: string,
  filename: string = 'cv.pdf'
): Promise<ParsedCV> {
  const openai = new OpenAI({ apiKey });

  console.log('🔬 CV PARSER - Using GPT-4o with native PDF reading');
  console.log('📄 PDF buffer size:', pdfBuffer.length, 'bytes');
  console.log('📤 Uploading PDF to OpenAI for native parsing...');

  try {
    // Convert Buffer to File format for OpenAI
    const fileToUpload = await toFile(pdfBuffer, filename, { type: 'application/pdf' });
    
    // Upload the PDF file to OpenAI
    const uploadedFile = await openai.files.create({
      file: fileToUpload,
      purpose: 'assistants'
    });

    console.log('✅ PDF uploaded to OpenAI:', uploadedFile.id);

    // Create an assistant that can read PDFs
    const assistant = await openai.beta.assistants.create({
      name: "CV Parser",
      instructions: `You are an expert CV/Resume parser. Read the uploaded PDF CV and extract ALL information comprehensively.

CRITICAL: Extract EVERYTHING you see in the CV - be extremely thorough.

Return ONLY valid JSON with this exact structure:
{
  "name": "Full Name",
  "name_confidence": "high",
  "title": "Professional Title",
  "summary": "Professional summary if present",
  "contact": {
    "email": "email@example.com",
    "phone": "+1234567890",
    "location": "City, Country",
    "linkedin": "https://linkedin.com/in/username"
  },
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "location": "City, Country",
      "start_date": "YYYY-MM or YYYY",
      "end_date": "YYYY-MM or YYYY or Present",
      "bullets": [
        "First responsibility",
        "Second achievement",
        "Third project"
      ],
      "confidence": "high"
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "location": "City, Country",
      "start_date": "YYYY",
      "end_date": "YYYY",
      "confidence": "high"
    }
  ],
  "skills": ["Skill1", "Skill2", "Skill3"],
  "languages": ["English (Native)", "Spanish (Fluent)"],
  "seniority_level": "Junior|Mid|Senior|Lead"
}

RULES:
- Extract ALL work experiences with ALL bullet points
- Extract ALL education entries
- Extract ALL skills (technical only, not spoken languages)
- Spoken languages go in "languages" field with proficiency
- Return ONLY the JSON, no other text`,
      model: "gpt-4o",
      tools: [{ type: "file_search" }]
    });

    console.log('✅ Assistant created:', assistant.id);

    // Create a thread with the file
    const thread = await openai.beta.threads.create({
      messages: [
        {
          role: "user",
          content: "Please parse this CV completely and return the JSON with all information.",
          attachments: [
            {
              file_id: uploadedFile.id,
              tools: [{ type: "file_search" }]
            }
          ]
        }
      ]
    });

    console.log('✅ Thread created:', thread.id);

    // Run the assistant
    const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
      assistant_id: assistant.id
    });

    console.log('✅ Run completed:', run.status);

    if (run.status === 'completed') {
      const messages = await openai.beta.threads.messages.list(thread.id);
      const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
      
      if (assistantMessage && assistantMessage.content[0].type === 'text') {
        const responseText = assistantMessage.content[0].text.value;
        console.log('📥 Received response from assistant');
        
        // Extract JSON from response (might have markdown formatting)
        let jsonText = responseText;
        const jsonMatch = responseText.match(/```json\n?(.*?)\n?```/s) || responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonText = jsonMatch[1] || jsonMatch[0];
        }

        const parsed = JSON.parse(jsonText);
        
        // Clean up - delete the assistant and file
        await openai.beta.assistants.del(assistant.id);
        await openai.files.del(uploadedFile.id);
        
        console.log('✅ Successfully parsed CV with native PDF reading');
        console.log('   Name:', parsed.name || 'Not found');
        console.log('   Title:', parsed.title || 'Not found');
        console.log('   Experience entries:', parsed.experience?.length || 0);
        console.log('   Education entries:', parsed.education?.length || 0);
        console.log('   Skills:', parsed.skills?.length || 0);

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
      }
    }

    throw new Error(`Assistant run failed with status: ${run.status}`);

  } catch (error: any) {
    console.error('❌ Native PDF parsing failed:', error.message);
    throw error;
  }
}
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

CRITICAL MISSION: Extract EVERY SINGLE piece of information from this CV. Be EXTREMELY thorough and comprehensive.

YOU MUST EXTRACT:

1. **Personal Information** - Find the person's details (usually at top)
2. **ALL Work Experience** - Every single job, internship, or role
3. **ALL Education** - Every degree, certification, course
4. **ALL Skills** - Every technical skill, tool, framework, language
5. **ALL Spoken Languages** - Every language they speak/write

CRITICAL RULES FOR EXPERIENCE:
- Extract EVERY job - do NOT skip any
- For EACH job, extract ALL bullet points separately
- Each responsibility should be a separate item in the bullets array
- If you see 5 bullet points under a job, extract all 5
- If you see 10 bullet points, extract all 10
- DO NOT summarize or combine bullet points
- DO NOT skip details

EXAMPLE - If you see this in the CV:
---
Software Engineer | TechCorp | 2020-2023
• Led development of microservices architecture using Kubernetes
• Mentored team of 5 junior developers
• Implemented CI/CD pipelines reducing deployment time by 50%
• Collaborated with product team on feature planning
• Wrote technical documentation
---

You MUST return this JSON:
{
  "company": "TechCorp",
  "role": "Software Engineer",
  "start_date": "2020",
  "end_date": "2023",
  "bullets": [
    "Led development of microservices architecture using Kubernetes",
    "Mentored team of 5 junior developers",
    "Implemented CI/CD pipelines reducing deployment time by 50%",
    "Collaborated with product team on feature planning",
    "Wrote technical documentation"
  ],
  "confidence": "high"
}
```

OUTPUT FORMAT (JSON):
{
  "name": "Full Name",
  "name_confidence": "high|medium|low",
  "title": "Professional Title or Current Role",
  "summary": "Professional summary if present in CV",
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
      "location": "City, Country (if shown)",
      "start_date": "YYYY-MM or YYYY",
      "end_date": "YYYY-MM or YYYY or Present",
      "bullets": [
        "First bullet point exactly as shown",
        "Second bullet point exactly as shown",
        "Third bullet point exactly as shown",
        "... continue for ALL bullets"
      ],
      "confidence": "high"
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "degree": "Bachelor of Science / Master / PhD / etc",
      "field": "Field of Study",
      "location": "City, Country (if shown)",
      "start_date": "YYYY",
      "end_date": "YYYY",
      "confidence": "high"
    }
  ],
  "skills": ["JavaScript", "Python", "React", "AWS", "Docker"],
  "languages": ["English (Native)", "Spanish (Fluent)", "German (Basic)"],
  "seniority_level": "Junior|Mid|Senior|Lead|Principal"
}

EXTRACTION GUIDELINES:

**Experience (MOST IMPORTANT):**
- Look for sections: "Experience", "Work History", "Employment", "Professional Experience"
- Extract EVERY job listed
- For each job, extract ALL bullet points as separate array items
- Count the bullets - if CV shows 8 bullets, you must extract 8 bullets
- DO NOT combine multiple bullets into one
- DO NOT skip bullets
- Each achievement, responsibility, or project = separate bullet
- Include metrics, numbers, technologies mentioned in bullets

**Education:**
- Look for: "Education", "Academic Background", "Qualifications", "Certifications"
- Extract ALL degrees and certifications
- Include institution name, degree type, field of study, dates

**Skills:**
- Look for: "Skills", "Technical Skills", "Technologies", "Core Competencies"
- Extract ALL skills listed
- Include: Programming languages, frameworks, tools, methodologies
- DO NOT include spoken languages here (those go in "languages")

**Languages (Spoken):**
- Look for: "Languages", "Language Skills"
- Extract ALL spoken/written languages
- Include proficiency level if mentioned
- Examples: "English (Native)", "French (Fluent)", "Spanish (Intermediate)"

**Handling Messy Text:**
- The text may be poorly formatted due to PDF extraction
- Use context to identify sections even if headers are unclear
- Look for patterns: dates, company names, job titles
- Be smart about identifying what belongs together

**Confidence Levels:**
- "high": Information is clearly stated
- "medium": Information inferred from context
- "low": Information is unclear or ambiguous

Return ONLY valid JSON, no markdown formatting, no additional text.`;

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
    if (parsed.experience && parsed.experience.length > 0) {
      parsed.experience.forEach((exp: any, idx: number) => {
        console.log(`   Experience ${idx + 1}: ${exp.company} - ${exp.role}`);
        console.log(`      Bullets: ${exp.bullets?.length || 0} items`);
        if (exp.bullets && exp.bullets.length > 0) {
          exp.bullets.slice(0, 2).forEach((bullet: string, bidx: number) => {
            console.log(`        ${bidx + 1}. ${bullet.substring(0, 60)}...`);
          });
        }
      });
    }
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
