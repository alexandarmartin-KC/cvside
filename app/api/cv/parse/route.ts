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
      industries: ["Technology", "SaaS", "E-commerce"],
      locations: ["San Francisco, CA", "Remote"],
      years_experience_estimate: 7,
      summary: "Experienced full-stack developer with 7+ years building scalable web applications. Strong expertise in modern JavaScript frameworks, cloud infrastructure, and leading development teams. Proven track record of delivering high-quality products in fast-paced startup environments."
    };

    // Mock job matches with realistic scores
    const matches = [
      {
        jobId: 1,
        score: 95,
        reasoning: "Excellent match - your extensive full-stack experience with React, Node.js, and AWS aligns perfectly with the senior role requirements. Your 7 years of experience exceeds the 5+ years requirement."
      },
      {
        jobId: 4,
        score: 88,
        reasoning: "Strong match - your AWS and Docker experience combined with Python skills make you well-suited for this DevOps role. Your automation background is a key strength."
      },
      {
        jobId: 2,
        score: 85,
        reasoning: "Very good match - your React and TypeScript expertise directly matches the core requirements. Your senior experience would bring valuable leadership to the team."
      },
      {
        jobId: 8,
        score: 82,
        reasoning: "Good match - your 7 years of experience and technical leadership skills align with this Tech Lead position. Your broad technology stack is beneficial for leading diverse teams."
      },
      {
        jobId: 3,
        score: 70,
        reasoning: "Decent match - while your backend experience is strong, this role focuses on Python/Django which isn't your primary stack. Your PostgreSQL and Docker skills are relevant."
      },
      {
        jobId: 6,
        score: 65,
        reasoning: "Moderate match - you have some relevant skills like Python and AWS, but this role requires specific big data experience with Spark and Airflow that you haven't highlighted."
      },
      {
        jobId: 7,
        score: 45,
        reasoning: "Limited match - this mobile development role requires Swift/Kotlin experience which doesn't align with your web development background."
      },
      {
        jobId: 5,
        score: 35,
        reasoning: "Not a good match - this is a junior position and your senior-level experience makes you overqualified. You'd likely be better suited for more advanced roles."
      }
    ];

    // Return comprehensive response
    return NextResponse.json({
      cvProfile,
      matches,
      jobs: SAMPLE_JOBS
    });

  } catch (error) {
    console.error('Parse error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse CV' },
      { status: 500 }
    );
  }
}
