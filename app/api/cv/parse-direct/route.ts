import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * DIRECT TEXT + GPT-4o approach
 * Extract text from PDF, then use GPT-4o with ULTRA-comprehensive prompt
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'PDF required' }, { status: 400 });
    }

    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: 'PDF too large' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'API key missing' }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    console.log('📄 DIRECT TEXT PARSER');
    console.log('File:', file.name, '|', (file.size / 1024).toFixed(2), 'KB');

    // Extract text from PDF
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const pdfData = await pdf(buffer);
    const text = pdfData.text;

    console.log('📝 Extracted text length:', text.length, 'chars');
    console.log('First 1000 chars:', text.substring(0, 1000));

    // Ultra-comprehensive prompt that analyzes the RAW text
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a CV parser. The user will give you RAW TEXT extracted from a PDF CV.

The text may be messy (columns merged, weird spacing), but ALL the information is there.

YOUR MISSION:
1. Read EVERY LINE of the text carefully
2. Identify all job positions (look for company names, dates, job titles)
3. For EACH job, find ALL the bullet points or responsibility lines that follow it
4. Extract EVERY SINGLE responsibility/achievement line - do NOT skip or summarize
5. If you see 10 lines describing work under a job, extract all 10

IMPORTANT:
- The text might have strange line breaks or spacing - look at the CONTENT not format
- Look for phrases like "Resultater & arbejdsopgaver" or "Ansvar" that introduce responsibility lists
- Look for lines starting with verbs: "Design", "Gennemgang", "Opdatering", "Sikkerhedsansvarlig", etc.
- Each distinct responsibility = separate bullet in your output
- Count carefully - if original has 10 items, output must have 10 items

Return ONLY valid JSON (no markdown):
{
  "name": "full name",
  "email": "email",
  "phone": "phone",
  "location": "complete address",
  "title": "current job title",
  "experience": [
    {
      "company": "company",
      "role": "title",
      "start_date": "date",
      "end_date": "date",
      "location": "location",
      "bullets": ["EVERY single responsibility line - include ALL"]
    }
  ],
  "education": [
    {"institution": "name", "degree": "degree", "field": "field", "start_date": "year", "end_date": "year"}
  ],
  "skills": ["all skills"],
  "languages": ["all languages with levels"]
}`
        },
        {
          role: 'user',
          content: `Here is the complete text from the CV. Read EVERY line and extract ALL information. Do not skip any responsibilities or bullet points.

COMPLETE CV TEXT:
${text}

Extract everything. Count the responsibility lines under each job and include them ALL.`
        }
      ],
      temperature: 0,
      max_tokens: 4096,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from GPT-4o');
    }

    console.log('✅ GPT-4o response received');
    console.log('Response length:', content.length);

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error('Parse error:', e);
      throw new Error('Invalid JSON response');
    }

    console.log('📊 EXTRACTED:');
    console.log('Name:', parsed.name);
    console.log('Experience:', parsed.experience?.length || 0);
    
    if (parsed.experience) {
      parsed.experience.forEach((exp: any, i: number) => {
        console.log(`  ${i + 1}. ${exp.company} - ${exp.role}`);
        console.log(`     Bullets: ${exp.bullets?.length || 0}`);
        if (exp.bullets && exp.bullets.length > 0) {
          console.log(`     First 3:`);
          exp.bullets.slice(0, 3).forEach((b: string) => {
            console.log(`       • ${b.substring(0, 70)}...`);
          });
          if (exp.bullets.length > 3) {
            console.log(`       ... and ${exp.bullets.length - 3} more`);
          }
        }
      });
    }

    // Transform to expected format
    const cvProfile = {
      name: parsed.name || null,
      name_confidence: 'high',
      title: parsed.title || null,
      summary: parsed.summary || null,
      contact: {
        email: parsed.email || null,
        phone: parsed.phone || null,
        location: parsed.location || null,
        linkedin: parsed.linkedin || null
      },
      experience: (parsed.experience || []).map((exp: any, idx: number) => ({
        id: `exp-${Date.now()}-${idx}`,
        company: exp.company || 'Unknown',
        role: exp.role || 'Unknown',
        location: exp.location,
        start_date: exp.start_date || '',
        end_date: exp.end_date || '',
        bullets: exp.bullets || [],
        confidence: 'high'
      })),
      education: (parsed.education || []).map((edu: any, idx: number) => ({
        id: `edu-${Date.now()}-${idx}`,
        institution: edu.institution || 'Unknown',
        degree: edu.degree || 'Unknown',
        field: edu.field,
        location: edu.location,
        start_date: edu.start_date,
        end_date: edu.end_date,
        confidence: 'high'
      })),
      skills: parsed.skills || [],
      languages: parsed.languages || [],
      seniority_level: 'Mid'
    };

    const base64 = buffer.toString('base64');
    const cvDataUrl = `data:application/pdf;base64,${base64}`;

    console.log('✅ SUCCESS');
    
    return NextResponse.json({
      success: true,
      profile: cvProfile,
      cvDataUrl,
      matches: []
    });

  } catch (error: any) {
    console.error('❌ ERROR:', error);
    return NextResponse.json(
      { error: error.message || 'Failed' },
      { status: 500 }
    );
  }
}
