/**
 * CV Parser using OpenAI Assistants API
 * 
 * This is the REAL way ChatGPT processes PDFs:
 * - Upload PDF file to OpenAI
 * - Create an Assistant with file search capability
 * - The Assistant can read and understand the PDF structure
 * - No need for pdf-parse or image conversion
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
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Parse CV using Assistants API - the way ChatGPT does it
 */
export async function parseCVWithAssistants(pdfBuffer: Buffer, filename: string = 'cv.pdf'): Promise<ParsedCV> {
  console.log('🤖 Starting Assistants API CV parsing (like ChatGPT)...');
  
  try {
    // Step 1: Upload the PDF file
    console.log('📤 Uploading PDF to OpenAI...');
    const file = await openai.files.create({
      file: await toFile(pdfBuffer, filename, { type: 'application/pdf' }),
      purpose: 'assistants'
    });
    console.log('✅ File uploaded:', file.id);

    // Step 2: Create an Assistant
    console.log('🔧 Creating Assistant...');
    const assistant = await openai.beta.assistants.create({
      name: 'CV Parser Expert',
      instructions: `You are an expert CV/Resume parser. Extract ALL information from the uploaded CV PDF.

CRITICAL RULES FOR EXPERIENCE:
1. Extract EVERY single job/position listed in the CV
2. For EACH job, extract EVERY bullet point, responsibility, or achievement listed under it
3. If a job has 1 bullet, extract 1. If it has 10 bullets, extract all 10
4. DO NOT leave any job with empty bullets array unless there is truly no text under that job
5. Look for: bullet points (•, -, *, numbers), or paragraph descriptions
6. If a job has paragraph text instead of bullets, split it into separate points
7. Even short descriptions should be extracted as bullets

CRITICAL RULES FOR OTHER DATA:
- Extract full address/location including street, postal code, city
- Extract all education entries with complete information
- Extract ALL technical skills mentioned
- Extract language proficiency levels exactly as shown

Return ONLY a JSON object with this exact structure:
{
  "name": "Full Name",
  "name_confidence": "high",
  "title": "Professional Title or Current Position",
  "summary": "Professional summary if present in CV",
  "contact": {
    "email": "email@example.com",
    "phone": "+1234567890",
    "location": "Full address as shown in CV",
    "linkedin": "https://linkedin.com/in/username"
  },
  "experience": [
    {
      "company": "Company Name",
      "role": "Job Title",
      "location": "City, Country",
      "start_date": "Month Year or Year",
      "end_date": "Month Year or Year or Present or Nuværende",
      "bullets": [
        "First responsibility exactly as written",
        "Second responsibility exactly as written",
        "Continue for ALL bullets/descriptions under this job"
      ],
      "confidence": "high"
    }
  ],
  "education": [
    {
      "institution": "Institution Name",
      "degree": "Degree Type",
      "field": "Field of Study",
      "location": "Location if shown",
      "start_date": "Year",
      "end_date": "Year",
      "confidence": "high"
    }
  ],
  "skills": ["Skill1", "Skill2", "Skill3"],
  "languages": ["English (Native)", "Spanish (Fluent)"],
  "seniority_level": "Junior|Mid|Senior|Lead|Principal"
}`,
      model: 'gpt-4o',
      tools: [{ type: 'file_search' }]
    });
    console.log('✅ Assistant created:', assistant.id);

    // Step 3: Create a Thread
    console.log('💬 Creating thread...');
    const thread = await openai.beta.threads.create({
      messages: [
        {
          role: 'user',
          content: 'Please analyze the uploaded CV PDF and extract ALL information in the specified JSON format. Be extremely thorough - extract every job, every bullet point, every skill. Return ONLY the JSON object, no additional text.',
          attachments: [
            {
              file_id: file.id,
              tools: [{ type: 'file_search' }]
            }
          ]
        }
      ]
    });
    console.log('✅ Thread created:', thread.id);

    // Step 4: Run the Assistant
    console.log('⚙️ Running assistant...');
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id
    });

    // Step 5: Wait for completion
    console.log('⏳ Waiting for completion...');
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds timeout

    while (runStatus.status !== 'completed' && attempts < maxAttempts) {
      if (runStatus.status === 'failed' || runStatus.status === 'cancelled' || runStatus.status === 'expired') {
        throw new Error(`Assistant run ${runStatus.status}: ${runStatus.last_error?.message || 'Unknown error'}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      attempts++;
      
      if (attempts % 5 === 0) {
        console.log(`   Still processing... (${attempts}s, status: ${runStatus.status})`);
      }
    }

    if (runStatus.status !== 'completed') {
      throw new Error('Assistant run timed out');
    }

    console.log('✅ Assistant completed!');

    // Step 6: Get the response
    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantMessage = messages.data.find(msg => msg.role === 'assistant');
    
    if (!assistantMessage) {
      throw new Error('No response from assistant');
    }

    const content = assistantMessage.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const responseText = content.text.value;
    console.log('📄 Response length:', responseText.length);
    console.log('First 200 chars:', responseText.substring(0, 200));

    // Step 7: Parse the JSON response
    let parsed: any;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```json\n?(.*?)\n?```/s) || responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        parsed = JSON.parse(jsonStr);
      } else {
        parsed = JSON.parse(responseText);
      }
    } catch (e) {
      console.error('❌ Failed to parse JSON:', e);
      console.error('Response was:', responseText);
      throw new Error('Could not parse JSON from assistant response');
    }

    // Step 8: Clean up
    console.log('🧹 Cleaning up...');
    await openai.beta.assistants.del(assistant.id);
    await openai.files.del(file.id);
    console.log('✅ Cleanup complete');

    // Log what we extracted
    console.log('📊 Extraction results:');
    console.log('- Name:', parsed.name);
    console.log('- Experience entries:', parsed.experience?.length || 0);
    
    if (parsed.experience && parsed.experience.length > 0) {
      parsed.experience.forEach((exp: any, idx: number) => {
        console.log(`  Experience ${idx + 1}: ${exp.company} - ${exp.role}`);
        console.log(`    Dates: ${exp.start_date} to ${exp.end_date}`);
        console.log(`    Bullets: ${exp.bullets?.length || 0} items`);
        if (exp.bullets && exp.bullets.length > 0) {
          exp.bullets.slice(0, 2).forEach((bullet: string, i: number) => {
            console.log(`      ${i + 1}. ${bullet.substring(0, 60)}${bullet.length > 60 ? '...' : ''}`);
          });
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
      seniority_level: parsed.seniority_level || undefined
    };

    return result;

  } catch (error: any) {
    console.error('❌ Assistants API error:', error);
    console.error('Error details:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw new Error(`CV parsing failed: ${error.message}`);
  }
}
