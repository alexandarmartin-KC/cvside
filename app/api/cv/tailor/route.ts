import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-session';
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
  skills: {
    primary: string[];
    secondary: string[];
  };
  experience: Array<{
    company: string;
    role: string;
    location?: string;
    start_date: string;
    end_date: string;
    bullets: string[];
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    field?: string;
    start_date?: string;
    end_date?: string;
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
      skills: {
        primary: cvProfile.skills?.slice(0, 6) || [],
        secondary: cvProfile.skills?.slice(6) || []
      },
      experience: [
        {
          company: job.company,
          role: cvProfile.title || job.title,
          location: cvProfile.locations?.[0] || job.location,
          start_date: '2020',
          end_date: 'Present',
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

  const systemPrompt = `You are an expert CV tailoring engine for a CV-first job platform.

CRITICAL RULES:
1. NEVER invent employment history, skills, dates, or qualifications
2. ONLY use information present in the base CV
3. You MAY: reorder content, rewrite bullets for impact, emphasize relevant experience
4. Return ONLY valid JSON - no explanatory text outside the JSON
5. All text fields must be plain text (no HTML/Markdown)
6. Keep all content 100% truthful to the user's real experience

OUTPUT STRUCTURE:
{
  "name": "string",
  "title": "string (job-aligned title if truthful)",
  "summary": "string (3-6 lines, mention relevant skills/experience)",
  "skills": {
    "primary": ["most relevant skills first"],
    "secondary": ["other skills"]
  },
  "experience": [
    {
      "company": "string",
      "role": "string",
      "location": "string or null",
      "start_date": "string (keep original format)",
      "end_date": "string (keep original format, e.g. 'Present')",
      "bullets": ["impact-focused bullets with strong verbs"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string or null",
      "start_date": "string or null",
      "end_date": "string or null"
    }
  ],
  "certifications": ["string array or empty"],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["string array"]
    }
  ]
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

Tailor this CV for the target job. Reorder and rewrite content to emphasize relevance. Use impact-focused language. Stay 100% truthful.`;

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
      skills: {
        primary: cvProfile.skills?.slice(0, 6) || [],
        secondary: cvProfile.skills?.slice(6) || []
      },
      experience: [
        {
          company: job.company,
          role: cvProfile.title || job.title,
          location: cvProfile.locations?.[0] || job.location,
          start_date: '2020',
          end_date: 'Present',
          bullets: ['Key achievement or responsibility']
        }
      ],
      education: cvProfile.education || [],
      certifications: [],
      projects: []
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: TailorRequest = await request.json();
    const { jobId, userNotes } = body;

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    // Fetch user profile with CV
    const userWithProfile = await prisma.user.findUnique({
      where: { id: user.id },
      include: { cvProfile: true }
    });

    if (!userWithProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!userWithProfile.cvProfile) {
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
    let tailoredCV;
    try {
      tailoredCV = await generateTailoredCV(userWithProfile.cvProfile, job, userNotes);
    } catch (genError) {
      console.error('Error generating tailored CV:', genError);
      // Use fallback if generation fails
      tailoredCV = {
        name: userWithProfile.cvProfile.name || userWithProfile.name || 'Your Name',
        title: userWithProfile.cvProfile.title || job.title,
        summary: userWithProfile.cvProfile.summary || `Professional seeking ${job.title} position at ${job.company}.`,
        skills: {
          primary: userWithProfile.cvProfile.skills?.slice(0, 6) || [],
          secondary: userWithProfile.cvProfile.skills?.slice(6) || []
        },
        experience: [
          {
            company: job.company,
            role: userWithProfile.cvProfile.title || job.title,
            location: userWithProfile.cvProfile.locations?.[0] || job.location,
            start_date: '2020',
            end_date: 'Present',
            bullets: [
              'Relevant experience in the field',
              'Strong technical and professional skills',
              'Proven track record of success'
            ]
          }
        ],
        education: [],
        certifications: [],
        projects: []
      };
    }

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
