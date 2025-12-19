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

// Validation helper to check if CV content stays truthful
function validateNoHallucination(tailoredCV: any, cvProfile: any): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check if name matches (allow minor formatting differences)
  if (tailoredCV.name && cvProfile.name) {
    const normalizedTailored = tailoredCV.name.toLowerCase().replace(/[^a-z]/g, '');
    const normalizedOriginal = cvProfile.name.toLowerCase().replace(/[^a-z]/g, '');
    if (!normalizedTailored.includes(normalizedOriginal) && !normalizedOriginal.includes(normalizedTailored)) {
      issues.push(`Name mismatch: generated "${tailoredCV.name}" vs original "${cvProfile.name}"`);
    }
  }
  
  // Check if all primary skills exist in original skills
  if (tailoredCV.skills?.primary && cvProfile.skills) {
    const originalSkillsLower = cvProfile.skills.map((s: string) => s.toLowerCase());
    const invalidSkills = tailoredCV.skills.primary.filter(
      (skill: string) => !originalSkillsLower.some((orig: string) => 
        orig.includes(skill.toLowerCase()) || skill.toLowerCase().includes(orig)
      )
    );
    if (invalidSkills.length > 0) {
      issues.push(`Skills not in original CV: ${invalidSkills.join(', ')}`);
    }
  }
  
  return { valid: issues.length === 0, issues };
}

// Generate a safe fallback CV that uses only real data
function generateFallbackCV(cvProfile: any, job: any): TailoredCVSection {
  // Build summary by combining existing summary with job-relevant skills
  const relevantSkills = cvProfile.skills?.filter((skill: string) => 
    job.skills?.some((jobSkill: string) => 
      skill.toLowerCase().includes(jobSkill.toLowerCase()) || 
      jobSkill.toLowerCase().includes(skill.toLowerCase())
    )
  ) || [];
  
  const summary = cvProfile.summary || 
    `${cvProfile.seniority || 'Professional'} ${cvProfile.title || 'specialist'} with expertise in ${relevantSkills.slice(0, 3).join(', ') || 'various technologies'}. Seeking opportunities to contribute to impactful projects.`;
  
  return {
    name: cvProfile.name || '',
    title: cvProfile.title || '',
    summary: summary,
    skills: {
      primary: relevantSkills.slice(0, 6),
      secondary: cvProfile.skills?.filter((s: string) => !relevantSkills.includes(s)).slice(0, 8) || []
    },
    experience: [],
    education: [],
    certifications: [],
    projects: []
  };
}

async function generateTailoredCV(
  cvProfile: any,
  job: any,
  userNotes?: string
): Promise<TailoredCVSection> {
  // Check if OpenAI API key is available
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️ OPENAI_API_KEY not set - using fallback CV generation (no AI)');
    console.warn('Set OPENAI_API_KEY environment variable to enable real CV parsing');
    return generateFallbackCV(cvProfile, job);
  }

  console.log('✓ Using OpenAI to tailor CV');
  
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const systemPrompt = `You are an expert CV tailoring engine for a CV-first job platform.

CRITICAL RULES - ZERO TOLERANCE FOR VIOLATIONS:
1. NEVER invent employment history, skills, dates, companies, job titles, or qualifications
2. ONLY use information explicitly present in the base CV or raw CV text
3. If the CV lacks experience/education/projects sections, return EMPTY ARRAYS - do NOT fabricate
4. You MAY: reorder content, rewrite bullets for clarity/impact, emphasize relevant experience, prioritize skills
5. You MAY: shorten or remove irrelevant content to focus on job-relevant achievements
6. Return ONLY valid JSON - no explanatory text outside the JSON structure
7. All text fields must be plain text (no HTML, no Markdown, no special formatting)
8. Keep all content 100% truthful and verifiable from the source CV
9. Preserve exact company names, dates, and titles unless user explicitly provides corrections
10. If you cannot extract detailed experience, focus on skills and summary only

OUTPUT STRUCTURE:
{
  "name": "string (exact name from CV)",
  "title": "string (current/recent title from CV, optionally refined for target role)",
  "summary": "string (2-4 sentences highlighting relevant experience and skills for THIS job)",
  "skills": {
    "primary": ["top 6-8 skills most relevant to job posting"],
    "secondary": ["other skills from CV, less central to job"]
  },
  "experience": [
    {
      "company": "string (exact company name)",
      "role": "string (exact role title)",
      "location": "string or null",
      "start_date": "string (exact format from CV)",
      "end_date": "string (exact format, e.g. 'Present', '2023', 'Dec 2023')",
      "bullets": ["rewritten achievement/responsibility bullets emphasizing impact and relevance"]
    }
  ],
  "education": [
    {
      "institution": "string (exact school name)",
      "degree": "string (e.g., 'Bachelor of Science', 'MBA')",
      "field": "string or null (major/field of study)",
      "start_date": "string or null",
      "end_date": "string or null"
    }
  ],
  "certifications": ["exact certification names from CV"],
  "projects": [
    {
      "name": "string (project name from CV)",
      "description": "string (rewritten for clarity and relevance)",
      "technologies": ["tech stack from CV"]
    }
  ]
}

REMEMBER: Empty arrays are better than fabricated data. If CV has no detailed experience/education/projects, return []`;

  // Build comprehensive user prompt with all available CV data
  let cvDataSection = `=== BASE CV DATA ===
Name: ${cvProfile.name || 'N/A'}
Current Title: ${cvProfile.title || 'N/A'}
Seniority Level: ${cvProfile.seniority || 'N/A'}
Skills: ${cvProfile.skills?.join(', ') || 'N/A'}
Professional Summary: ${cvProfile.summary || 'N/A'}
Locations: ${cvProfile.locations?.join(', ') || 'N/A'}`;
  
  // Include raw CV text if available for richer context
  if (cvProfile.rawCvText) {
    cvDataSection += `\n\n=== ORIGINAL CV TEXT ===\n${cvProfile.rawCvText.substring(0, 4000)}`; // Limit to ~4000 chars to avoid token limits
  }
  
  const userPrompt = `${cvDataSection}

=== TARGET JOB ===
Job Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Required Skills: ${job.skills?.join(', ') || 'Not specified'}
Job Description:
${job.description}

${userNotes ? `=== USER TAILORING NOTES ===\n${userNotes}\n\n` : ''}
=== TASK ===
Tailor this CV for the target job:
1. Prioritize skills that match job requirements
2. Rewrite summary to emphasize relevant experience for THIS specific role
3. If experience details available, highlight achievements relevant to job description
4. Remove or de-emphasize content not relevant to this position
5. Use strong action verbs and quantifiable achievements
6. Maintain 100% truthfulness - do NOT add anything not in the source CV

Output the tailored CV in the exact JSON structure specified.`;

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
    
    // Validate that no hallucination occurred
    const validation = validateNoHallucination(tailoredCV, cvProfile);
    if (!validation.valid) {
      console.warn('CV tailoring validation failed:', validation.issues);
      // Log issues but still return the CV - in production, you might want stricter handling
      console.warn('Proceeding with generated CV despite validation warnings');
    }
    
    return tailoredCV;
  } catch (error) {
    console.error('OpenAI API error:', error);
    // Use safe fallback that doesn't invent data
    return generateFallbackCV(cvProfile, job);
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

    // Log what CV data we're working with
    console.log('CV Profile data:', {
      name: userWithProfile.cvProfile.name,
      title: userWithProfile.cvProfile.title,
      hasRawCvText: !!userWithProfile.cvProfile.rawCvText,
      rawCvTextLength: userWithProfile.cvProfile.rawCvText?.length || 0,
      skillsCount: userWithProfile.cvProfile.skills?.length || 0
    });

    // Fetch job details
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Generate tailored CV (has internal error handling with safe fallback)
    const tailoredCV = await generateTailoredCV(userWithProfile.cvProfile, job, userNotes);

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
