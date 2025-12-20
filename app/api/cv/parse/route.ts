import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SAMPLE_JOBS = [
  {
    id: 1,
    title: 'Senior Full-Stack Developer',
    company: 'TechCorp',
    location: 'San Francisco, CA',
    skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS'],
    description: 'Looking for an experienced full-stack developer to lead our product development team. Must have 5+ years experience with modern web technologies.'
  },
  {
    id: 2,
    title: 'Frontend React Developer',
    company: 'StartupXYZ',
    location: 'Remote',
    skills: ['React', 'TypeScript', 'CSS', 'Redux', 'Jest'],
    description: 'Join our growing startup to build beautiful user interfaces. 3+ years React experience required.'
  },
  {
    id: 3,
    title: 'Backend Engineer',
    company: 'CloudTech',
    location: 'New York, NY',
    skills: ['Python', 'Django', 'PostgreSQL', 'Docker', 'Kubernetes'],
    description: 'Build scalable backend systems for our cloud platform. Strong Python and database skills required.'
  },
  {
    id: 4,
    title: 'DevOps Engineer',
    company: 'BigTech Inc',
    location: 'Seattle, WA',
    skills: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'Python'],
    description: 'Manage and scale our infrastructure. 5+ years experience with cloud platforms and automation.'
  },
  {
    id: 5,
    title: 'Junior Software Developer',
    company: 'CodeAcademy',
    location: 'Austin, TX',
    skills: ['JavaScript', 'HTML', 'CSS', 'Git', 'React'],
    description: 'Entry-level position for new graduates. Learn and grow with our mentorship program.'
  },
  {
    id: 6,
    title: 'Data Engineer',
    company: 'DataCorp',
    location: 'Boston, MA',
    skills: ['Python', 'Spark', 'SQL', 'Airflow', 'AWS'],
    description: 'Build data pipelines and ETL processes. 4+ years experience with big data technologies.'
  },
  {
    id: 7,
    title: 'Mobile Developer (iOS/Android)',
    company: 'MobileFirst',
    location: 'Los Angeles, CA',
    skills: ['Swift', 'Kotlin', 'React Native', 'iOS', 'Android'],
    description: 'Develop cross-platform mobile applications. Experience with both iOS and Android preferred.'
  },
  {
    id: 8,
    title: 'Tech Lead',
    company: 'Enterprise Solutions',
    location: 'Chicago, IL',
    skills: ['Java', 'Spring Boot', 'Microservices', 'Leadership', 'Agile'],
    description: 'Lead a team of 5-8 engineers building enterprise software. 7+ years experience and leadership skills required.'
  }
];

// Mock functions (not used in demo mode, but kept for future API integration)
async function analyzeCV(cvText: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  
  console.log('🤖 OpenAI API Key present:', apiKey.substring(0, 7) + '...' + apiKey.substring(apiKey.length - 4));
  console.log('🤖 CV text length:', cvText.length, 'characters');
  
  const openai = new OpenAI({
    apiKey: apiKey,
  });

  console.log('🤖 Sending CV to OpenAI for intelligent parsing...');

  // Try GPT-4 first, fall back to GPT-3.5-turbo if not available
  const model = process.env.OPENAI_MODEL || 'gpt-4';
  console.log('🤖 Using model:', model);

  const systemPrompt = `You are a conservative CV parsing engine for a job platform.

Your task is to extract structured CV data from raw CV text so the user can
confirm each extracted field in a verification wizard.

The input is full plaintext extracted from a PDF. The layout may be broken:
- columns merged
- dates separated from job titles
- OCR errors
- inconsistent spacing and newlines

CORE PRINCIPLES:
- NEVER guess or invent information
- ONLY extract what is literally present in the text
- If uncertain, set fields to null and mark confidence low
- It is better to return incomplete but correct than complete but wrong
- Provide source snippets to help user confirm/correct during onboarding

-----------------------------------
WHAT YOU MUST IDENTIFY:
-----------------------------------

1. Candidate personal info
   - name
   - email
   - phone
   - location
   - linkedin URL if present

2. Work experience
   - employer/company
   - job title/role
   - start/end dates
   - location (optional)
   - bullet points under job
   - confidence level for dates
   - original text snippet

3. Education history
   - institution
   - degree
   - field
   - start/end dates
   - confidence + snippet

4. Skills list
5. Languages list
6. Professional title (if present)
7. Summary/profile paragraph (optional)

-----------------------------------
NAME RULES:
-----------------------------------
- Only extract name if clearly shown
- Usually in top lines or near contact info
- If multiple names appear, choose the one associated with contact details
- If uncertain, set name_confidence = "low"

-----------------------------------
SKILLS & LANGUAGES RULES:
-----------------------------------
- Skills are technical abilities, tools, frameworks, methodologies (e.g., "Python", "React", "Agile", "AWS")
- Languages are spoken/written languages (e.g., "English", "Danish", "Spanish", "Mandarin")
- IMPORTANT: Separate languages from skills - do NOT include language names in the skills array
- Common language keywords: English, Danish, Dansk, Spanish, French, German, Swedish, Norwegian, Finnish, Dutch, Italian, Portuguese, Russian, Chinese, Mandarin, Japanese, Korean, Arabic, Hindi, etc.
- If you see language proficiency (Native, Fluent, Intermediate, Basic, C1, B2, etc.), include it as an object: {"name": "Danish", "proficiency": "Native"}
- Otherwise, just the language name as a string

-----------------------------------
DATE RULES:
-----------------------------------
- Only extract dates exactly as written
- DO NOT infer missing months/years
- If date does not confidently belong to a job → start & end = null, confidence low
- Preserve original ordering and formatting
- Prefer to leave ambiguous date associations unresolved

-----------------------------------
EXPERIENCE RULES:
-----------------------------------
- CRITICAL: Extract ALL work experience entries from the CV
- A job/experience entry is any past or current employment
- Collapse lines that clearly belong to a job into a single experience object
- A job is defined by at least a company OR a role
- Bullets may follow without a header; include them if they appear plausibly linked
- If unsure about grouping, assign to job but mark date_confidence low
- Always include a source_snippet showing the raw lines used
- DO NOT skip experiences - include everything found in the CV

-----------------------------------
OUTPUT FORMAT (STRICT)
-----------------------------------
Return a single JSON object in exactly this format:

{
  "name": "string or null",
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
  "languages": [
    "string" 
    OR 
    {"name": "string", "proficiency": "Native" | "Fluent" | "Intermediate" | "Basic" | null},
    ...
  ],
  "experience": [
    {
      "id": "exp_1",
      "company": "string or null",
      "role": "string or null",
      "location": "string or null",
      "start_date": "string or null",
      "end_date": "string or null",
      "date_confidence": "high" | "medium" | "low",
      "bullets": ["string", ...],
      "source_snippet": "short excerpt of lines"
    }
  ],
  "education": [
    {
      "id": "edu_1",
      "institution": "string or null",
      "degree": "string or null",
      "field": "string or null",
      "start_date": "string or null",
      "end_date": "string or null",
      "details": ["string", ...],
      "source_snippet": "short excerpt of lines"
    }
  ]
}

-----------------------------------
STRICT INSTRUCTIONS
-----------------------------------
- Use null instead of incorrect inference
- Always provide arrays, even if empty
- IDs must be stable simple identifiers like "exp_1", "exp_2", "edu_1", "edu_2"
- DO NOT include any text outside the JSON
- DO NOT output explanations
- DO NOT hallucinate fields
- DO NOT guess if date/title/company association is weak → mark low confidence and preserve snippet
- If a section does not appear in the source, return an empty array/list

YOUR OUTPUT WILL BE SHOWN IN A WIZARD WHERE USERS CONFIRM OR CORRECT:
- name
- job titles + companies
- dates
- skills
- languages
- education details

This means conservative uncertainty is acceptable and expected.`;

  try {
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Parse this CV/Resume and extract all information:\n\n${cvText.substring(0, 12000)}`
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
  console.log('🤖 OpenAI successfully parsed CV');
  console.log('   Name:', parsed.name, `(confidence: ${parsed.name_confidence || 'unknown'})`);
  console.log('   Title:', parsed.title);
  console.log('   Skills count:', parsed.skills?.length || 0);
  console.log('   Experience entries:', parsed.experience?.length || 0);
  console.log('   Education entries:', parsed.education?.length || 0);

  return parsed;
  
  } catch (error: any) {
    // If GPT-4 is not available (404 or 400), try GPT-3.5-turbo
    if ((error?.status === 404 || error?.status === 400) && model === 'gpt-4') {
      console.warn('⚠️ GPT-4 not available, retrying with gpt-3.5-turbo...');
      
      const fallbackCompletion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemPrompt  // Use same conservative prompt
          },
          {
            role: 'user',
            content: `Parse this CV/Resume and extract all information:\n\n${cvText.substring(0, 12000)}`
          }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      });
      
      const fallbackContent = fallbackCompletion.choices[0]?.message?.content;
      if (!fallbackContent) {
        throw new Error('No response from OpenAI (fallback model)');
      }
      
      const parsed = JSON.parse(fallbackContent);
      console.log('✅ Successfully parsed with gpt-3.5-turbo');
      console.log('   Name:', parsed.name, `(confidence: ${parsed.name_confidence || 'unknown'})`);
      
      return parsed;
    }
    
    // Re-throw if not a model availability issue
    throw error;
  }
}

async function rankJobs(cvProfile: any) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are a job matching expert. Given a candidate profile and job listings, rank ALL jobs from best to worst fit. Return STRICT JSON with this structure:
{
  "matches": [
    {
      "jobId": 1,
      "score": 95,
      "reasoning": "brief 1-2 sentence explanation"
    }
  ]
}
Include ALL 8 jobs ranked by fit. Scores should be 0-100.`
      },
      {
        role: 'user',
        content: `Candidate Profile:\n${JSON.stringify(cvProfile, null, 2)}\n\nJobs to rank:\n${JSON.stringify(SAMPLE_JOBS, null, 2)}\n\nRank ALL 8 jobs by fit for this candidate.`
      }
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' }
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI for job ranking');
  }

  return JSON.parse(content);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate it's a PDF
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    // Validate file size (4MB limit)
    const maxSize = 4 * 1024 * 1024; // 4MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'PDF file is too large. Maximum size is 4MB.' },
        { status: 400 }
      );
    }

    // Convert file to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Convert to base64 data URL for storage
    const base64 = buffer.toString('base64');
    const cvDataUrl = `data:application/pdf;base64,${base64}`;

    // Extract text from PDF using pdf-parse
    const pdfData = await pdf(buffer);
    const extractedText = pdfData.text;

    if (!extractedText || extractedText.trim().length === 0) {
      return NextResponse.json(
        { error: 'Could not extract text from PDF' },
        { status: 400 }
      );
    }

    // Try to use OpenAI to parse the CV, fall back to text extraction if not available
    let cvProfile;
    let matches;
    
    if (process.env.OPENAI_API_KEY) {
      try {
        console.log('Using OpenAI to parse CV...');
        cvProfile = await analyzeCV(extractedText);
        matches = await rankJobs(cvProfile);
        console.log('Successfully parsed CV with OpenAI');
      } catch (error: any) {
        if (error?.status === 400) {
          console.error('❌ OpenAI Bad Request (400) - Invalid request format');
          console.error('   Error message:', error?.message);
          console.error('   Error type:', error?.type);
          console.error('   Error code:', error?.code);
          if (error?.error) {
            console.error('   Error details:', JSON.stringify(error.error, null, 2));
          }
          console.error('   Full error object:', JSON.stringify(error, null, 2));
          console.error('\nPossible causes:');
          console.error('   - Invalid model name (try gpt-3.5-turbo if gpt-4 not available)');
          console.error('   - Request payload too large');
          console.error('   - Invalid parameters in request');
        } else if (error?.status === 429 || error?.message?.includes('429')) {
          console.error('⚠️ OpenAI rate limit (429). Extracting basic info from CV text...');
        } else if (error?.status === 401 || error?.message?.includes('401') || error?.message?.includes('Incorrect API key')) {
          console.error('❌ OpenAI API key invalid or missing. Check OPENAI_API_KEY environment variable.');
          console.error('   Error:', error?.message || error);
        } else if (error?.code === 'ENOTFOUND' || error?.code === 'ETIMEDOUT') {
          console.error('❌ Network error connecting to OpenAI:', error?.message);
        } else {
          console.error('❌ OpenAI parsing failed, extracting basic info from text');
          console.error('   Error type:', error?.constructor?.name);
          console.error('   Error message:', error?.message);
          console.error('   Error status:', error?.status);
          console.error('   Full error:', JSON.stringify(error, null, 2));
        }
        cvProfile = extractBasicInfoFromText(extractedText);
        matches = getMockMatches();
      }
    } else {
      console.warn('OPENAI_API_KEY not set, extracting basic info from text');
      cvProfile = extractBasicInfoFromText(extractedText);
      matches = getMockMatches();
    }

    // Add compatibility layer for frontend (old format expected)
    // New format: { skills: [], languages: [], contact: { location: "..." } }
    // Old format: { core_skills: [], locations: [] }
    const compatibleProfile = {
      ...cvProfile,
      core_skills: cvProfile.skills || cvProfile.core_skills || [],
      locations: cvProfile.contact?.location 
        ? [cvProfile.contact.location]
        : (cvProfile.locations || []),
      seniority_level: cvProfile.seniority_level || "Mid",
      // Keep new format fields too for future compatibility
      skills: cvProfile.skills || cvProfile.core_skills || [],
      languages: cvProfile.languages || [],
      contact: cvProfile.contact || {},
      // Ensure experience and education have IDs
      experience: (cvProfile.experience || []).map((exp: any, idx: number) => ({
        ...exp,
        id: exp.id || `exp_${idx + 1}`
      })),
      education: (cvProfile.education || []).map((edu: any, idx: number) => ({
        ...edu,
        id: edu.id || `edu_${idx + 1}`
      })),
    };

    // Return comprehensive response
    return NextResponse.json({
      cvProfile: compatibleProfile,
      matches: matches.matches || matches,
      jobs: SAMPLE_JOBS,
      cvDataUrl,  // Include the base64 PDF data URL
      fileName: file.name,
      extractedText: extractedText // Include raw text for storage
    });

  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse CV' },
      { status: 500 }
    );
  }
}

function getMockProfile() {
  return {
    name: "John Doe",
    title: "Senior Full-Stack Developer",
    seniority_level: "Senior",
    core_skills: ["JavaScript", "TypeScript", "React", "Node.js", "PostgreSQL", "AWS", "Docker"],
    locations: ["San Francisco, CA", "Remote"],
    summary: "Experienced full-stack developer with 7+ years building scalable web applications. Strong expertise in modern JavaScript frameworks, cloud infrastructure, and leading development teams. Proven track record of delivering high-quality products in fast-paced startup environments."
  };
}

// Extract basic info from CV text without AI - follows strict parsing rules
function extractBasicInfoFromText(text: string) {
  console.log('📄 Extracting structured info from CV text (length:', text.length, 'chars)');
  console.log('📄 First 1000 chars of CV text:', text.substring(0, 1000));
  
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  console.log('📄 First 20 lines:', lines.slice(0, 20));
  
  // Words that indicate this is NOT a name
  const notNameIndicators = [
    'ansvarlig', 'koordinering', 'supervision', 'design', 'implementering',
    'procedurer', 'opdatering', 'gennemgang', 'resultater', 'arbejdsopgaver',
    'erfaring', 'uddannelse', 'kontakt', 'summary', 'profile', 'experience',
    'education', 'skills', 'certifications', 'projects', 'references',
    'for ', 'og ', 'med ', 'til ', 'fra ', 'som ', 'hvor ', 'samt ',
    'manager', 'developer', 'engineer', 'specialist', 'consultant', 'lead',
    'sikkerhed', 'hovedkontor', 'leverandør', 'monitoring', 'control',
    'eksamineret', 'sikringsleder', 'cfpa', 'chauffeur', 'vagtsupervisor',
    'operatør', 'sikkerhedsvagt', 'kommunikation', 'færdigheder', 'sprog'
  ];
  
  // Try to find name
  let name = "";
  
  // Strategy 1: Look for "CV" followed by a name on the next line
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    if (lines[i].match(/^CV$/i) && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      const nextLineLower = nextLine.toLowerCase();
      
      // Check it's not a job title or indicator
      if (!notNameIndicators.some(ind => nextLineLower.includes(ind)) &&
          !nextLine.includes(':') &&
          nextLine.length >= 5 && nextLine.length <= 40 &&
          nextLine.split(/\s+/).length >= 2) {
        name = nextLine;
        console.log('✓ Found name (after CV):', name);
        break;
      }
    }
  }
  
  // Strategy 2: Look for a personal name pattern (2-4 capitalized words, no job keywords)
  if (!name) {
    for (let i = 0; i < Math.min(30, lines.length); i++) {
      const line = lines[i];
      const lineLower = line.toLowerCase();
      
      // Skip if contains NOT-name indicators
      if (notNameIndicators.some(ind => lineLower.includes(ind))) continue;
      
      // Skip common headers, labels, and lines with special characters
      if (line.match(/^(CV|Kontakt|Uddannelse|Erfaring|Færdigheder|Sprog|Mobil|Email|Adresse)$/i)) continue;
      if (line.includes(':') || line.includes('@') || line.includes('+') || line.match(/\d{4}/)) continue;
      
      // Skip long lines
      if (line.length > 35) continue;
      
      // Name should have 2-4 words
      const words = line.split(/\s+/);
      if (words.length < 2 || words.length > 4) continue;
      
      // Each word should start with capital and be reasonable length
      const looksLikeName = words.every(word => 
        word.match(/^[A-ZÆØÅÉÈÊËÄÖÜÁÍÓÚ]/) && 
        word.length >= 2 && word.length <= 15 &&
        !word.match(/\d/)
      );
      
      if (looksLikeName) {
        name = line;
        console.log('✓ Found name (pattern):', name);
        break;
      }
    }
  }
  
  if (!name) {
    name = "Unknown";
    console.log('⚠️ Could not find name');
  }
  
  let name_confidence: "high" | "medium" | "low" = "medium";
  if (name === "Unknown") {
    name_confidence = "low";
  } else if (name.split(/\s+/).length >= 2 && !name.match(/\d/)) {
    name_confidence = "high";
  }
  
  // Extract contact information
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?(\(?\d{2,4}\)?[-.\s]?)?\d{3,4}[-.\s]?\d{3,4}/g;
  const linkedinRegex = /(linkedin\.com\/in\/[a-zA-Z0-9_-]+|linkedin\.com\/pub\/[a-zA-Z0-9_-]+)/gi;
  
  const emailMatch = text.match(emailRegex);
  const phoneMatch = text.match(phoneRegex);
  const linkedinMatch = text.match(linkedinRegex);
  
  const email = emailMatch ? emailMatch[0] : null;
  const phone = phoneMatch ? phoneMatch[0].trim() : null;
  const linkedin = linkedinMatch ? `https://${linkedinMatch[0]}` : null;
  
  console.log('✓ Contact info - Email:', email, 'Phone:', phone, 'LinkedIn:', linkedin ? 'found' : 'not found');
  
  // Find title - look for "Eksamineret Sikringsleder, CFPA" or similar professional titles
  let title = "";
  const titlePatterns = [
    /eksamineret\s+sikringsleder/i,
    /sikkerhedsspecialist/i,
    /security\s+(manager|specialist|consultant)/i,
    /\bCFPA\b/i,
    /(senior|lead|chief|head)\s+\w+/i
  ];
  
  for (const line of lines.slice(0, 30)) {
    for (const pattern of titlePatterns) {
      if (line.match(pattern) && line.length < 80) {
        // Don't use job bullets as title
        if (!line.startsWith('•') && !line.startsWith('-')) {
          title = line;
          console.log('✓ Found title:', title);
          break;
        }
      }
    }
    if (title) break;
  }
  
  if (!title) {
    // Fallback: look for line with "CFPA" or professional designation
    for (const line of lines.slice(0, 20)) {
      if (line.match(/CFPA|MBA|PhD|MSc|BSc|CPA|PMP/i) && line.length < 60) {
        title = line;
        console.log('✓ Found title (designation):', title);
        break;
      }
    }
  }
  
  if (!title) {
    title = "Professional";
    console.log('⚠️ Could not find title');
  }
  
  // Extract skills - look for technical terms, certifications, tools
  const skillPatterns = [
    // Programming & Tech
    /\b(JavaScript|TypeScript|Python|Java|C\+\+|C#|Ruby|PHP|Swift|Kotlin|Go|Rust|Scala)\b/gi,
    /\b(React|Angular|Vue|Node\.?js|Django|Flask|Spring|Laravel|Express)\b/gi,
    /\b(AWS|Azure|GCP|Google Cloud|Docker|Kubernetes|Jenkins|Git|GitHub|GitLab|Linux|Unix)\b/gi,
    /\b(SQL|PostgreSQL|MySQL|MongoDB|Redis|Oracle|Elasticsearch|DynamoDB)\b/gi,
    /\b(HTML|CSS|REST|API|GraphQL|Microservices|Agile|Scrum|CI\/CD)\b/gi,
    
    // Business & Enterprise
    /\b(SAP|Salesforce|Microsoft Dynamics|Tableau|Power BI)\b/gi,
    /\b(Microsoft Office|Excel|PowerPoint|Word|Outlook)\b/gi,
    /\b(Project Management|Team Leadership|Budgeting|Strategy|Analysis)\b/gi,
    
    // Security & Safety (expanded for your CV)
    /\b(CFPA|ISO\s*\d+|GDPR|Sikkerhed|Security|Safety|Risk Management|Compliance)\b/gi,
    /\b(Physical Security|Cyber Security|Access Control|CCTV|Surveillance)\b/gi,
    /\b(Milestone|AXIS|XProtect|Genetec|Lenel|Honeywell|SiPass)\b/gi,
    /\b(TVO|ADK|AIA|SOC|Penetration)\b/gi,
    /\b(Vagtsupervisor|Sikkerhedsvagt|Sikringsleder)\b/gi,
    
    // General Tools
    /\b(Jira|Confluence|Slack|Teams|Zoom|Asana|Trello|Notion)\b/gi,
    /\b(Photoshop|Illustrator|Figma|Sketch|InDesign|AutoCAD)\b/gi,
    
    // Languages
    /\b(English|Engelsk|Danish|Dansk|German|Tysk|French|Spanish|Norwegian|Swedish)\b/gi,
  ];
  
  const skillsSet = new Set<string>();
  const fullText = text;
  
  for (const pattern of skillPatterns) {
    const matches = fullText.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Normalize some common variations
        const normalized = match.trim();
        skillsSet.add(normalized);
      });
    }
  }
  
  const core_skills = Array.from(skillsSet).slice(0, 20);
  console.log('✓ Found', core_skills.length, 'skills:', core_skills.slice(0, 10).join(', '), '...');
  
  // Try to find location
  const locations: string[] = [];
  const locationPatterns = [
    /\b(Denmark|Danmark|Copenhagen|København|Aarhus|Odense|Aalborg|Lyngby)\b/gi,
    /\b(Norway|Norge|Sweden|Sverige|Germany|Tyskland)\b/gi,
    /\b\d{4}\s+[A-ZÆØÅ][a-zæøå]+/g, // Danish postal codes (4 digits + city)
  ];
  
  for (const pattern of locationPatterns) {
    const matches = fullText.match(pattern);
    if (matches) {
      matches.slice(0, 5).forEach(match => {
        const clean = match.trim();
        if (!locations.some(loc => loc.toLowerCase() === clean.toLowerCase())) {
          locations.push(clean);
        }
      });
    }
  }
  
  const primaryLocation = locations.length > 0 ? locations[0] : null;
  console.log('✓ Found location:', primaryLocation || 'None');
  
  // Create a simple summary
  const skillsList = core_skills.slice(0, 4).join(', ') || 'various skills';
  const summary = title 
    ? `${title}${core_skills.length > 0 ? ' with expertise in ' + skillsList : ''}.`
    : null;
  
  // Extract languages (common language names)
  const languagePatterns = /\b(English|Engelsk|Danish|Dansk|German|Tysk|German|Deutsch|French|Français|Spanish|Español|Italian|Italiano|Norwegian|Norsk|Swedish|Svenska|Dutch|Nederlands|Portuguese|Português|Chinese|Mandarin|Japanese|Korean|Arabic|Russian|Polish|Hindi|Bengali|Turkish|Vietnamese|Thai)\b/gi;
  const languageMatches = fullText.match(languagePatterns) || [];
  const languages = [...new Set(languageMatches.map(l => l.charAt(0).toUpperCase() + l.slice(1).toLowerCase()))];
  console.log('✓ Found languages:', languages.join(', ') || 'None');
  
  // Return structured data matching the new CV parsing format
  const result = {
    name,
    name_confidence,
    title: title || null,
    summary,
    contact: {
      email,
      phone,
      location: primaryLocation,
      linkedin
    },
    skills: core_skills,
    languages: languages,
    experience: [] as any[],  // Would need more sophisticated parsing
    education: [] as any[],   // Would need more sophisticated parsing
    raw_notes: "Fallback parser used - OpenAI unavailable. Experience and education sections not extracted."
  };
  
  console.log('✅ Extracted profile:', JSON.stringify(result, null, 2));
  
  return result;
}

function getMockMatches() {
  return [
      {
        jobId: 1,
        score: 95,
        reasons: [
          "Your 7 years of experience exceeds the 5+ years requirement",
          "Strong match in core technologies: React, Node.js, PostgreSQL, and AWS",
          "Senior-level experience aligns perfectly with team leadership expectations",
          "Location preference matches (San Francisco, CA)"
        ]
      },
      {
        jobId: 4,
        score: 88,
        reasons: [
          "Extensive AWS and Docker experience matches DevOps requirements",
          "5+ years of experience meets the minimum threshold",
          "Strong automation and infrastructure skills demonstrated",
          "Cloud platform expertise is a core strength in your profile"
        ]
      },
      {
        jobId: 2,
        score: 85,
        reasons: [
          "Expert-level React and TypeScript skills directly match requirements",
          "Your senior experience would bring valuable mentorship",
          "Remote location preference aligns with job offering",
          "Modern frontend development is a demonstrated strength"
        ]
      },
      {
        jobId: 8,
        score: 82,
        reasons: [
          "7 years of experience qualifies for Tech Lead position",
          "Demonstrated technical leadership in previous roles",
          "Broad full-stack knowledge valuable for team guidance",
          "Senior-level expertise supports mentoring junior engineers"
        ]
      },
      {
        jobId: 3,
        score: 70,
        reasons: [
          "Strong backend fundamentals with Node.js and PostgreSQL",
          "Docker and Kubernetes experience is relevant",
          "Python/Django is not your primary stack, creating skill gap",
          "Would require learning curve for Python-specific frameworks"
        ]
      },
      {
        jobId: 6,
        score: 65,
        reasons: [
          "AWS experience is relevant for cloud-based pipelines",
          "Some Python exposure mentioned in profile",
          "Missing specialized big data tools (Spark, Airflow)",
          "Would require significant upskilling in data engineering"
        ]
      },
      {
        jobId: 7,
        score: 45,
        reasons: [
          "No mobile development experience mentioned",
          "Swift and Kotlin are outside your skill set",
          "Web development background doesn't transfer directly"
        ]
      },
      {
        jobId: 5,
        score: 35,
        reasons: [
          "This is a junior-level position",
          "Your 7 years of senior experience makes you overqualified",
          "Better suited for mid-to-senior level opportunities"
        ]
      }
    ];
}
