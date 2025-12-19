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
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  console.log('🤖 Sending CV to OpenAI for parsing...');
  console.log('📄 CV text preview (first 300 chars):', cvText.substring(0, 300));

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are a precision CV/resume parser. Your job is to extract EXACT information.

ABSOLUTELY CRITICAL RULES:
1. The person's NAME must be EXACTLY as written - every letter, every special character (æ, ø, å, é, ü, etc.)
2. Do NOT translate, simplify, or anglicize names. "Alexx Martin Højgård" stays EXACTLY as "Alexx Martin Højgård"
3. Job titles must be EXACT - "Eksamineret Sikringsleder, CFPA" NOT "Certified Security Manager"
4. Extract ALL skills, certifications, technologies mentioned
5. Keep Danish/foreign text exactly as written
6. Look at the VERY BEGINNING of the CV - the name is usually in the first few lines
7. Names often appear right after "CV" header or at the very top

Return ONLY valid JSON:
{
  "name": "EXACT full name (look at top of CV, after 'CV' header if present)",
  "title": "EXACT current/recent job title (don't translate)",
  "seniority_level": "Junior|Mid|Senior|Lead|Executive",
  "core_skills": ["every skill, tool, certification, technology mentioned"],
  "locations": ["cities, countries mentioned"],
  "summary": "2-3 sentence professional summary based on CV content"
}

NO MARKDOWN. ONLY JSON.`
      },
      {
        role: 'user',
        content: `Extract information from this CV. The name is at the TOP of the document - find it EXACTLY as written:\n\n${cvText.substring(0, 8000)}`
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
  console.log('🤖 OpenAI extracted:', JSON.stringify(parsed, null, 2));

  return parsed;
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
        if (error?.status === 429 || error?.message?.includes('429')) {
          console.warn('⚠️ OpenAI rate limit (429). Extracting basic info from CV text...');
        } else {
          console.error('OpenAI parsing failed, extracting basic info from text:', error);
        }
        cvProfile = extractBasicInfoFromText(extractedText);
        matches = getMockMatches();
      }
    } else {
      console.warn('OPENAI_API_KEY not set, extracting basic info from text');
      cvProfile = extractBasicInfoFromText(extractedText);
      matches = getMockMatches();
    }

    // Return comprehensive response
    return NextResponse.json({
      cvProfile,
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

// Extract basic info from CV text without AI
function extractBasicInfoFromText(text: string) {
  console.log('📄 Extracting basic info from CV text (length:', text.length, 'chars)');
  console.log('📄 First 500 chars of CV text:', text.substring(0, 500));
  
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  console.log('📄 First 10 lines:', lines.slice(0, 10));
  
  // Try to find name - look more carefully in first 15 lines
  let name = "";
  
  // Strategy 1: Look for a line that looks like a name (2-4 words, proper case)
  for (let i = 0; i < Math.min(20, lines.length); i++) {
    const line = lines[i];
    
    // Skip common headers and labels
    if (line.match(/^(CV|Curriculum|Resume|Vitae|Contact|Email|Phone|Address|Mobil|Adresse|Født|Nationalitet|Erfaring|Kontakt|Summary|Experience|Education|Skills|Profile)$/i)) {
      continue;
    }
    
    // Skip lines with dates, emails, phone numbers
    if (line.match(/@|phone|mobil|tlf|\d{4,}|http|www\./i)) {
      continue;
    }
    
    // Skip single words unless it's clearly a name
    const words = line.split(/\s+/);
    if (words.length < 2 || words.length > 5) continue;
    
    // Check if line looks like a person's name (each word starts with capital)
    const looksLikeName = words.every(word => 
      word.match(/^[A-ZÆØÅÉÈÊËÄÖÜÁÍÓÚ][a-zæøåéèêëäöüáíóúxx]*$/i) && word.length >= 2
    );
    
    if (looksLikeName && line.length >= 5 && line.length <= 60) {
      name = line;
      console.log('✓ Found name (pattern match):', name);
      break;
    }
  }
  
  // Strategy 2: Look for "Name: Value" or "Navn: Value" format
  if (!name) {
    for (const line of lines.slice(0, 15)) {
      const match = line.match(/^(Name|Navn|Full Name|Fulde Navn)[\s:]+(.+)$/i);
      if (match) {
        name = match[2].trim();
        console.log('✓ Found name (labeled):', name);
        break;
      }
    }
  }
  
  // Strategy 3: If CV starts with "CV" header, name is likely the next substantial line
  if (!name) {
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      if (lines[i].match(/^CV$/i)) {
        // Look at next few lines
        for (let j = i + 1; j < i + 4 && j < lines.length; j++) {
          const nextLine = lines[j];
          // Skip labels like "Født:", "Nationalitet:"
          if (nextLine.includes(':')) continue;
          if (nextLine.length >= 5 && nextLine.length <= 60 && !nextLine.match(/^\d/)) {
            name = nextLine;
            console.log('✓ Found name (after CV header):', name);
            break;
          }
        }
        break;
      }
    }
  }
  
  if (!name) {
    name = "Unknown";
    console.log('⚠️ Could not find name, using "Unknown"');
  }
  
  // Try to find title/role - look for common job title patterns
  let title = "";
  const titleKeywords = [
    'Developer', 'Engineer', 'Manager', 'Designer', 'Analyst', 'Specialist', 'Consultant', 
    'Architect', 'Lead', 'Director', 'Chef', 'Leder', 'Sikringsleder', 'Sikkerhedsspecialist',
    'CFPA', 'Eksamineret', 'Coordinator', 'Administrator', 'Officer'
  ];
  
  for (let i = 0; i < Math.min(20, lines.length); i++) {
    const line = lines[i];
    // Skip the name line
    if (line === name) continue;
    
    // Look for lines containing job title keywords
    if (titleKeywords.some(kw => line.toLowerCase().includes(kw.toLowerCase())) && 
        line.length > 3 && 
        line.length < 150) {
      // Don't pick lines that look like company names or dates
      if (!line.match(/\d{4}/) && !line.match(/A\/S|ApS|Ltd|Inc|Corp|GmbH/)) {
        title = line;
        console.log('✓ Found title:', title);
        break;
      }
    }
    
    // Also check for "Title: Value" or "Current Role:" format
    if (line.match(/^(Title|Role|Position|Current Role|Titel|Stilling):\s*(.+)$/i)) {
      title = line.split(':').slice(1).join(':').trim();
      console.log('✓ Found title (labeled):', title);
      break;
    }
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
    /\b(SAP|Salesforce|Oracle|Microsoft Dynamics|Tableau|Power BI|Excel|PowerPoint)\b/gi,
    /\b(Project Management|Team Leadership|Budgeting|Strategy|Analysis)\b/gi,
    
    // Security & Safety
    /\b(CFPA|ISO\s*\d+|GDPR|Sikkerhed|Security|Safety|Risk Management|Compliance)\b/gi,
    /\b(Physical Security|Cyber Security|Access Control|CCTV|Surveillance)\b/gi,
    /\b(Milestone|XProtect|Genetec|Lenel|Honeywell)\b/gi,
    
    // General Tools
    /\b(Jira|Confluence|Slack|Teams|Zoom|Asana|Trello|Notion)\b/gi,
    /\b(Photoshop|Illustrator|Figma|Sketch|InDesign|AutoCAD)\b/gi,
    
    // Languages
    /\b(English|Danish|Dansk|German|Tysk|French|Spanish|Norwegian|Swedish)\b/gi,
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
  
  console.log('✓ Found locations:', locations.join(', ') || 'None');
  
  // Determine seniority from context
  let seniority_level = "Mid";
  const seniorityText = fullText.toLowerCase();
  if (seniorityText.match(/senior|lead|principal|staff|architect|chef|leder|director/)) {
    seniority_level = "Senior";
  } else if (seniorityText.match(/junior|entry|graduate|intern|trainee/)) {
    seniority_level = "Junior";
  } else if (seniorityText.match(/\d+\+?\s*(?:years|år|year)/)) {
    // Look for year counts
    const yearMatch = seniorityText.match(/(\d+)\+?\s*(?:years|år)/);
    if (yearMatch && parseInt(yearMatch[1]) >= 5) {
      seniority_level = "Senior";
    }
  }
  
  // Create a summary from extracted data
  const skillsList = core_skills.slice(0, 4).join(', ') || 'various technologies';
  const summary = title 
    ? `${title}${core_skills.length > 0 ? ' with expertise in ' + skillsList : ''}. Seeking new opportunities to contribute skills and experience.`
    : `Professional with expertise in ${skillsList}. Seeking new opportunities.`;
  
  const result = {
    name,
    title: title || "Professional",
    seniority_level,
    core_skills,
    locations: locations.length > 0 ? locations : ["Remote"],
    summary
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
