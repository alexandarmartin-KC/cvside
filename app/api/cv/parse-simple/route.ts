import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * ULTRA-SIMPLE CV Parser
 * Sends the ENTIRE PDF directly to GPT-4o and asks it to extract everything.
 * No intermediate processing, no pdf-parse mangling.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    const maxSize = 4 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'PDF too large. Max 4MB.' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    console.log('🚀 ULTRA-SIMPLE PARSER STARTING');
    console.log('📄 File:', file.name, '|', (file.size / 1024).toFixed(2), 'KB');

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Step 1: Upload file to OpenAI
    console.log('📤 Uploading PDF to OpenAI...');
    const uploadedFile = await openai.files.create({
      file: new File([buffer], file.name, { type: 'application/pdf' }),
      purpose: 'assistants'
    });
    console.log('✅ Uploaded:', uploadedFile.id);

    // Step 2: Create assistant
    console.log('🤖 Creating assistant...');
    const assistant = await openai.beta.assistants.create({
      name: 'CV Extractor',
      instructions: `You are extracting information from a CV/Resume. Extract EVERYTHING you see.

CRITICAL RULES FOR EXPERIENCE:
1. Extract EVERY single job/position listed
2. For EACH job, extract EVERY bullet point/responsibility/achievement listed under it
3. Even if a job has only 1-2 bullets, extract them
4. Even if a job seems to have no bullets but has a description, extract that as bullets
5. DO NOT leave any job with empty bullets array unless there truly is no text under that job
6. Look for: bullet points (•, -, *), numbered lists, or paragraph descriptions
7. If job has a paragraph description instead of bullets, split it into separate bullet points

EXAMPLE - If the CV shows:
---
Vagtsupervisor | Ørsted | 2021-2022
• Supervised security team
• Managed daily operations
---
You MUST return:
{
  "company": "Ørsted",
  "role": "Vagtsupervisor", 
  "bullets": ["Supervised security team", "Managed daily operations"]
}

If NO bullets visible under a job, look for ANY text/description and extract it.

Return ONLY this JSON structure:
{
  "name": "full name",
  "email": "email",
  "phone": "phone number",
  "location": "full address/location",
  "title": "current job title/professional headline",
  "summary": "professional summary if present",
  "experience": [
    {
      "company": "company name",
      "role": "job title",
      "start_date": "start date (e.g. 'November 2022', '2022', etc.)",
      "end_date": "end date or 'Nuværende' or 'Present'",
      "location": "job location if shown",
      "bullets": ["responsibility 1", "responsibility 2", "achievement 3", "ALL bullets/descriptions"]
    }
  ],
  "education": [
    {"institution": "school name", "degree": "degree name", "field": "field of study", "start_date": "year", "end_date": "year"}
  ],
  "skills": ["skill1", "skill2", "all technical skills"],
  "languages": ["language with proficiency level"]
}

Be thorough. Extract everything you see in the document.`,
      model: 'gpt-4o',
      tools: [{ type: 'file_search' }]
    });

    // Step 3: Create thread with file
    console.log('💬 Creating thread...');
    const thread = await openai.beta.threads.create({
      messages: [{
        role: 'user',
        content: 'Extract ALL information from this CV. Be thorough - extract every job, every bullet point, every skill. Return ONLY the JSON object.',
        attachments: [{ file_id: uploadedFile.id, tools: [{ type: 'file_search' }] }]
      }]
    });

    // Step 4: Run
    console.log('⚙️ Running...');
    let run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id
    });

    // Step 5: Wait
    let attempts = 0;
    while (run.status !== 'completed' && attempts < 60) {
      if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
        throw new Error(`Run ${run.status}: ${run.last_error?.message}`);
      }
      await new Promise(r => setTimeout(r, 1000));
      run = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      attempts++;
      if (attempts % 5 === 0) console.log(`   Waiting... ${attempts}s`);
    }

    if (run.status !== 'completed') {
      throw new Error('Timeout');
    }

    console.log('✅ Completed!');

    // Step 6: Get response
    const messages = await openai.beta.threads.messages.list(thread.id);
    const response = messages.data.find(m => m.role === 'assistant');
    
    if (!response || response.content[0].type !== 'text') {
      throw new Error('No response');
    }

    const text = response.content[0].text.value;
    console.log('📄 Response length:', text.length);
    console.log('First 500 chars:', text.substring(0, 500));

    // Parse JSON
    let parsed: any;
    try {
      const jsonMatch = text.match(/```json\n?(.*?)\n?```/s) || text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : text);
    } catch (e) {
      console.error('❌ Parse error:', e);
      console.error('Response:', text);
      throw new Error('Could not parse JSON');
    }

    console.log('📊 EXTRACTED DATA:');
    console.log('Name:', parsed.name);
    console.log('Experience:', parsed.experience?.length || 0);
    if (parsed.experience) {
      parsed.experience.forEach((exp: any, i: number) => {
        console.log(`  ${i + 1}. ${exp.company} - ${exp.role}`);
        console.log(`     Bullets: ${exp.bullets?.length || 0}`);
        if (exp.bullets) {
          exp.bullets.slice(0, 3).forEach((b: string) => {
            console.log(`       • ${b.substring(0, 60)}...`);
          });
        }
      });
    }
    console.log('Education:', parsed.education?.length || 0);
    console.log('Skills:', parsed.skills?.length || 0);

    // Cleanup
    console.log('🧹 Cleaning up...');
    await openai.beta.assistants.del(assistant.id);
    await openai.files.del(uploadedFile.id);

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
        linkedin: null
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

    // Store CV data URL
    const base64 = buffer.toString('base64');
    const cvDataUrl = `data:application/pdf;base64,${base64}`;

    console.log('✅ SUCCESS - Returning data');
    
    return NextResponse.json({
      success: true,
      profile: cvProfile,
      cvDataUrl,
      matches: []
    });

  } catch (error: any) {
    console.error('❌ ERROR:', error);
    return NextResponse.json(
      { error: error.message || 'Parsing failed' },
      { status: 500 }
    );
  }
}
