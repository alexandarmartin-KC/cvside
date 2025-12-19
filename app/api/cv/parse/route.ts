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

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `You are a CV parsing expert. Extract structured information from CVs and return STRICT JSON with these exact fields:
- name (string)
- title (string - current or most recent job title)
- seniority_level (string - e.g., Junior, Mid, Senior, Lead, etc.)
- core_skills (array of strings - top technical/professional skills)
- industries (array of strings - industries they've worked in)
- locations (array of strings - locations mentioned)
- years_experience_estimate (number - estimated total years)
- summary (string - brief 2-3 sentence professional summary)

Return ONLY valid JSON, no markdown or additional text.`
      },
      {
        role: 'user',
        content: `Parse this CV:\n\n${cvText}`
      }
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' }
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  return JSON.parse(content);
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

    // Mock CV Profile (for demo without OpenAI API)
    const cvProfile = {
      name: "John Doe",
      title: "Senior Full-Stack Developer",
      seniority_level: "Senior",
      core_skills: ["JavaScript", "TypeScript", "React", "Node.js", "PostgreSQL", "AWS", "Docker"],
      locations: ["San Francisco, CA", "Remote"],
      summary: "Experienced full-stack developer with 7+ years building scalable web applications. Strong expertise in modern JavaScript frameworks, cloud infrastructure, and leading development teams. Proven track record of delivering high-quality products in fast-paced startup environments."
    };

    // Mock job matches with 3-5 bullet point reasons
    const matches = [
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

    // Return comprehensive response
    return NextResponse.json({
      cvProfile,
      matches,
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
