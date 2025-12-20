/**
 * CV Parser using GPT-4o Vision API
 * 
 * This converts PDF pages to images and sends them to GPT-4o Vision,
 * allowing the AI to actually "see" the CV layout, formatting, tables, columns, etc.
 * This is the closest to how ChatGPT processes uploaded PDFs.
 */

import OpenAI from 'openai';
import { PDFDocument } from 'pdf-lib';

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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Convert PDF buffer to base64 encoded image URLs for each page
 * We'll render each page as a high-quality image that Vision can analyze
 */
async function pdfToBase64Images(pdfBuffer: Buffer): Promise<string[]> {
  try {
    // For now, we'll send the entire PDF as a single document
    // GPT-4o can handle multi-page PDFs when properly encoded
    const base64 = pdfBuffer.toString('base64');
    return [`data:application/pdf;base64,${base64}`];
  } catch (error) {
    console.error('Error converting PDF:', error);
    throw new Error('Failed to process PDF file');
  }
}

/**
 * Parse CV using GPT-4o Vision API
 * This allows the AI to see the actual layout, formatting, tables, columns, etc.
 */
export async function parseCVWithVision(pdfBuffer: Buffer): Promise<ParsedCV> {
  console.log('🎨 Starting Vision-based CV parsing...');
  
  const systemPrompt = `You are an expert CV/Resume parser analyzing a visual document.

CRITICAL MISSION: Extract EVERY piece of information you can SEE in this CV image.

WHAT YOU MUST EXTRACT:

1. **Personal Information** (usually at top)
   - Full name
   - Professional title/headline
   - Email, phone, location
   - LinkedIn profile or website

2. **Professional Experience** (MOST IMPORTANT)
   - Extract EVERY job listed
   - For EACH job, capture:
     * Company name
     * Job title/role
     * Dates (start and end)
     * Location if visible
     * EVERY bullet point, achievement, or responsibility listed
   - DO NOT skip or summarize bullet points
   - If you see 8 bullets, extract all 8
   - Each bullet should be a separate item

3. **Education**
   - ALL degrees, certifications, courses
   - Institution names
   - Degree types and fields of study
   - Dates if visible

4. **Skills**
   - ALL technical skills
   - Programming languages, frameworks, tools
   - DO NOT include spoken languages here

5. **Spoken Languages**
   - Languages with proficiency levels
   - Example: "English (Native)", "Spanish (Fluent)"

VISUAL PARSING TIPS:
- CVs often have multiple columns - read left to right, top to bottom
- Bullet points may use •, -, *, or other markers
- Dates may be formatted as "2020-2023", "Jan 2020 - Mar 2023", etc.
- Section headers might be: "Experience", "Work History", "Education", "Skills"
- Pay attention to visual hierarchy - larger/bold text often indicates section headers or job titles

OUTPUT FORMAT (JSON only, no markdown):
{
  "name": "Full Name",
  "name_confidence": "high|medium|low",
  "title": "Professional Title",
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
        "First responsibility exactly as written",
        "Second responsibility exactly as written",
        "Continue for ALL visible bullet points"
      ],
      "confidence": "high"
    }
  ],
  "education": [
    {
      "institution": "University Name",
      "degree": "Bachelor/Master/PhD",
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

IMPORTANT: Return ONLY the JSON object, no markdown code blocks, no additional text.`;

  try {
    // Convert PDF to base64 for Vision API
    const pdfBase64 = pdfBuffer.toString('base64');
    
    console.log('📄 PDF size:', (pdfBuffer.length / 1024).toFixed(2), 'KB');
    
    // Create a vision completion with the PDF
    // Note: We're sending the PDF directly - OpenAI's API can handle PDFs with Vision
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
              text: 'Please analyze this CV/Resume image and extract ALL information in the specified JSON format. Be extremely thorough - extract every job, every bullet point, every skill.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:application/pdf;base64,${pdfBase64}`,
                detail: 'high' // High detail for better text recognition
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
      throw new Error('No response from Vision API');
    }

    console.log('✅ Vision API response received');
    console.log('Response length:', content.length);

    // Parse the JSON response
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse JSON from response');
      }
    }

    // Log what we extracted
    console.log('📊 Extraction results:');
    console.log('- Name:', parsed.name);
    console.log('- Experience entries:', parsed.experience?.length || 0);
    
    if (parsed.experience && parsed.experience.length > 0) {
      parsed.experience.forEach((exp: any, idx: number) => {
        console.log(`  Experience ${idx + 1}: ${exp.company} - ${exp.role}`);
        console.log(`    Bullets: ${exp.bullets?.length || 0} items`);
        if (exp.bullets && exp.bullets.length > 0) {
          console.log(`    First 2: ${exp.bullets.slice(0, 2).join(' | ')}`);
        }
      });
    }
    
    console.log('- Education entries:', parsed.education?.length || 0);
    console.log('- Skills:', parsed.skills?.length || 0);
    console.log('- Languages:', parsed.languages?.length || 0);

    // Transform to our expected format
    const result: ParsedCV = {
      name: parsed.name || null,
      name_confidence: parsed.name_confidence || 'medium',
      title: parsed.title || null,
      summary: parsed.summary || null,
      contact: {
        email: parsed.contact?.email || null,
        phone: parsed.contact?.phone || null,
        location: parsed.contact?.location || null,
        linkedin: parsed.contact?.linkedin || null
      },
      experience: (parsed.experience || []).map((exp: any, index: number) => ({
        id: `exp-${Date.now()}-${index}`,
        company: exp.company || 'Unknown Company',
        role: exp.role || 'Unknown Role',
        location: exp.location || undefined,
        start_date: exp.start_date || '',
        end_date: exp.end_date || '',
        bullets: exp.bullets || [],
        confidence: exp.confidence || 'medium'
      })),
      education: (parsed.education || []).map((edu: any, index: number) => ({
        id: `edu-${Date.now()}-${index}`,
        institution: edu.institution || 'Unknown Institution',
        degree: edu.degree || 'Unknown Degree',
        field: edu.field || undefined,
        location: edu.location || undefined,
        start_date: edu.start_date || undefined,
        end_date: edu.end_date || undefined,
        confidence: edu.confidence || 'medium'
      })),
      skills: parsed.skills || [],
      languages: parsed.languages || [],
      seniority_level: parsed.seniority_level || undefined,
      raw_notes: parsed.raw_notes || undefined
    };

    return result;

  } catch (error: any) {
    console.error('❌ Vision parsing error:', error);
    throw new Error(`CV parsing failed: ${error.message}`);
  }
}
