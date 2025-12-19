import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import prisma from '@/lib/prisma';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface TailorRequest {
  jobId: string;
  userNotes?: string;
}

interface TailoredCVSection {
  name: string;
  title: string;
  summary: string;
  skills: string[];
  experience: Array<{
    title: string;
    company?: string;
    location?: string;
    duration?: string;
    bullets: string[];
  }>;
  education?: Array<{
    degree: string;
    institution: string;
    year?: string;
  }>;
  certifications?: string[];
  projects?: Array<{
    name: string;
    description: string;
    technologies?: string[];
  }>;
}

interface DesignOptions {
  templates: Array<{
    id: string;
    display_name: string;
    description: string;
    strengths: string[];
  }>;
  colors: Array<{
    id: string;
    name: string;
    hex: string;
  }>;
  photo_option: {
    enabled: boolean;
    recommended_size: string;
    shape: string;
  };
}

interface DesignerPanelUI {
  panel_title: string;
  sections: Array<{
    section_name: string;
    ui_pattern: string;
    fields: Record<string, any>;
  }>;
  actions: string[];
}

interface TailoredCVResponse {
  tailored_cv: TailoredCVSection;
  design_options: DesignOptions;
  designer_panel_ui: DesignerPanelUI;
  instructions_for_user_editing: string;
}

const DESIGN_OPTIONS: DesignOptions = {
  templates: [
    {
      id: 'classic-clean',
      display_name: 'Classic Clean',
      description: 'Simple single-column layout with generous spacing. Highly ATS-friendly and universally accepted.',
      strengths: [
        'Maximum ATS compatibility',
        'Professional appearance',
        'Easy to scan and read',
        'Suitable for all industries'
      ]
    },
    {
      id: 'modern-two-column',
      display_name: 'Modern Two-Column',
      description: 'Skills and contact info in narrow left sidebar, experience and achievements in right column.',
      strengths: [
        'Modern professional appearance',
        'Efficient use of space',
        'Highlights skills prominently',
        'Great for experienced professionals'
      ]
    },
    {
      id: 'technical-compact',
      display_name: 'Technical Compact',
      description: 'Dense layout optimized for engineers and technical roles. Priority on experience and bullet points.',
      strengths: [
        'Maximizes content density',
        'Focus on technical details',
        'Minimal visual distractions',
        'Ideal for engineering roles'
      ]
    },
    {
      id: 'creative-accent',
      display_name: 'Creative Accent',
      description: 'Clean visuals with subtle accent color sections. Optional icons and asymmetric layout.',
      strengths: [
        'Visually distinctive',
        'Shows design sensibility',
        'Modern and engaging',
        'Best for creative roles'
      ]
    }
  ],
  colors: [
    { id: 'neutral-black', name: 'Neutral Black', hex: '#000000' },
    { id: 'navy', name: 'Navy Blue', hex: '#1e3a8a' },
    { id: 'forest', name: 'Forest Green', hex: '#14532d' },
    { id: 'burgundy', name: 'Burgundy', hex: '#7c2d12' },
    { id: 'royal-blue', name: 'Royal Blue', hex: '#1e40af' },
    { id: 'soft-gold', name: 'Soft Gold', hex: '#92400e' }
  ],
  photo_option: {
    enabled: false,
    recommended_size: '120px',
    shape: 'circle'
  }
};

const DESIGNER_PANEL_UI: DesignerPanelUI = {
  panel_title: 'Style Your Tailored CV',
  sections: [
    {
      section_name: 'Template Selection',
      ui_pattern: 'horizontal_preview_cards',
      fields: {
        type: 'template_selector',
        display: 'grid',
        columns: 4
      }
    },
    {
      section_name: 'Color Theme',
      ui_pattern: 'color_swatch_buttons',
      fields: {
        type: 'color_picker',
        display: 'inline_swatches',
        default: 'neutral-black'
      }
    },
    {
      section_name: 'Profile Photo',
      ui_pattern: 'toggle_with_upload',
      fields: {
        type: 'photo_upload',
        toggle: 'include_photo',
        accepts: 'image/*',
        max_size: '5MB'
      }
    }
  ],
  actions: [
    'Save CV Version',
    'Download PDF',
    'Download DOCX',
    'Reset Changes',
    'Regenerate Tailored Draft'
  ]
};

async function generateTailoredCV(
  cvProfile: any,
  job: any,
  userNotes?: string
): Promise<TailoredCVSection> {
  // Check if OpenAI API key is available
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY not set, using fallback CV generation');
    // Return fallback immediately
    return {
      name: cvProfile.name || 'Your Name',
      title: cvProfile.title || job.title,
      summary: cvProfile.summary || `Professional with experience in ${job.skills?.slice(0, 3).join(', ')}. Seeking ${job.title} position at ${job.company}.`,
      skills: cvProfile.skills || [],
      experience: [
        {
          title: cvProfile.title || 'Professional Experience',
          company: job.company,
          location: cvProfile.locations?.[0] || job.location,
          duration: '',
          bullets: [
            'Experience with relevant technologies and methodologies',
            'Proven track record of delivering quality results',
            'Strong collaboration and communication skills'
          ]
        }
      ],
      education: [],
      certifications: [],
      projects: []
    };
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const systemPrompt = `You are a professional CV tailoring expert. Your task is to tailor a CV to a specific job posting.

CRITICAL RULES:
1. NEVER invent employment history, skills, dates, or qualifications
2. ONLY use information present in the base CV
3. You MAY: reorder content, rewrite bullets for impact, emphasize relevant experience, remove irrelevant details
4. Return ONLY valid JSON matching the exact structure provided
5. Keep all content truthful and aligned with the original CV

Return a JSON object with this EXACT structure:
{
  "name": "string",
  "title": "string - job-aligned title if truthful",
  "summary": "string - 2-3 impactful sentences using job keywords",
  "skills": ["array of skills reordered by relevance"],
  "experience": [
    {
      "title": "string",
      "company": "string (optional)",
      "location": "string (optional)",
      "duration": "string (optional)",
      "bullets": ["array of impact-focused achievement bullets"]
    }
  ],
  "education": [{"degree": "string", "institution": "string", "year": "string"}] (if available),
  "certifications": ["array of strings"] (if available),
  "projects": [{"name": "string", "description": "string", "technologies": ["array"]}] (if available)
}`;

  const userPrompt = `Base CV Data:
Name: ${cvProfile.name || 'N/A'}
Current Title: ${cvProfile.title || 'N/A'}
Seniority: ${cvProfile.seniority || 'N/A'}
Skills: ${cvProfile.skills?.join(', ') || 'N/A'}
Summary: ${cvProfile.summary || 'N/A'}
Locations: ${cvProfile.locations?.join(', ') || 'N/A'}

Target Job:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Required Skills: ${job.skills?.join(', ') || 'N/A'}
Description: ${job.description}

${userNotes ? `User Notes: ${userNotes}` : ''}

Tailor the CV to emphasize relevant skills and experience for this job. Rewrite the summary and bullets to align with the job requirements while staying 100% truthful to the original CV data.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const tailoredCV = JSON.parse(completion.choices[0].message.content || '{}');
    return tailoredCV;
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // Fallback: Return basic tailored structure
    return {
      name: cvProfile.name || 'Your Name',
      title: cvProfile.title || job.title,
      summary: cvProfile.summary || `Professional with experience in ${job.skills?.slice(0, 3).join(', ')}. Seeking ${job.title} position at ${job.company}.`,
      skills: cvProfile.skills || [],
      experience: [
        {
          title: cvProfile.title || 'Professional Experience',
          company: job.company,
          location: cvProfile.locations?.[0] || job.location,
          duration: '',
          bullets: [
            'Experience with relevant technologies and methodologies',
            'Proven track record of delivering quality results',
            'Strong collaboration and communication skills'
          ]
        }
      ],
      education: [],
      certifications: [],
      projects: []
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: TailorRequest = await request.json();
    const { jobId, userNotes } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    // Fetch user profile
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { cvProfile: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.cvProfile) {
      return NextResponse.json({ error: 'No CV profile found. Please upload a CV first.' }, { status: 400 });
    }

    // Fetch job details
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Generate tailored CV
    const tailoredCV = await generateTailoredCV(user.cvProfile, job, userNotes);

    // Construct response
    const response: TailoredCVResponse = {
      tailored_cv: tailoredCV,
      design_options: DESIGN_OPTIONS,
      designer_panel_ui: DESIGNER_PANEL_UI,
      instructions_for_user_editing: 'All sections are editable. Click any field to modify text. Use the design panel to customize your CV appearance. Changes are saved automatically. Export to PDF or DOCX when ready to apply.'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Tailor CV error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to tailor CV' },
      { status: 500 }
    );
  }
}
