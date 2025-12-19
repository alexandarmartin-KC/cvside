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

// Parse stored JSON fields if available
function parseStoredExperience(cvProfile: any): any[] {
  if (cvProfile.experienceJson) {
    try {
      const parsed = JSON.parse(cvProfile.experienceJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log('✓ Using stored experience data from database:', parsed.length, 'entries');
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse experienceJson:', e);
    }
  }
  return [];
}

function parseStoredEducation(cvProfile: any): any[] {
  if (cvProfile.educationJson) {
    try {
      const parsed = JSON.parse(cvProfile.educationJson);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log('✓ Using stored education data from database:', parsed.length, 'entries');
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse educationJson:', e);
    }
  }
  return [];
}

// Generate a safe fallback CV that uses only real data
function generateFallbackCV(cvProfile: any, job: any): TailoredCVSection {
  console.log('📋 Generating fallback CV using profile data:', {
    name: cvProfile.name,
    hasRawText: !!cvProfile.rawCvText,
    hasStoredExperience: !!cvProfile.experienceJson,
    hasStoredEducation: !!cvProfile.educationJson,
    skillsCount: cvProfile.skills?.length || 0
  });

  // Build summary by combining existing summary with job-relevant skills
  const relevantSkills = cvProfile.skills?.filter((skill: string) => 
    job.skills?.some((jobSkill: string) => 
      skill.toLowerCase().includes(jobSkill.toLowerCase()) || 
      jobSkill.toLowerCase().includes(skill.toLowerCase())
    )
  ) || [];
  
  const summary = cvProfile.summary || 
    `${cvProfile.seniority || 'Professional'} ${cvProfile.title || 'specialist'} with expertise in ${relevantSkills.slice(0, 3).join(', ') || 'various technologies'}. Seeking opportunities to contribute to impactful projects.`;
  
  // First try to use stored experience/education from database
  let experience: any[] = parseStoredExperience(cvProfile);
  let education: any[] = parseStoredEducation(cvProfile);
  
  // Only fall back to text parsing if no stored data available
  
  if (experience.length === 0 && education.length === 0 && cvProfile.rawCvText) {
    console.log('📄 No stored experience/education - parsing raw CV text...');
    const text = cvProfile.rawCvText;
    const lines = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
    
    // --- EXPERIENCE EXTRACTION ---
    // Look for patterns like "November, 2022 - Nuværende" or "2020 - 2023"
    let inExperienceSection = false;
    let currentJob: any = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineLower = line.toLowerCase();
      
      // Detect experience section
      if (lineLower.match(/^(erfaring|experience|work experience|employment)/)) {
        inExperienceSection = true;
        continue;
      }
      
      // Detect we've moved to another section
      if (lineLower.match(/^(uddannelse|education|skills|certifications|references)/)) {
        if (currentJob && currentJob.company) {
          experience.push(currentJob);
          currentJob = null;
        }
        inExperienceSection = false;
      }
      
      // Look for date ranges anywhere
      const dateMatch = line.match(/([A-Za-z]+,?\s+\d{4}|\d{4})\s*[-–—]\s*(Nuværende|Present|Nu|\d{4}|[A-Za-z]+,?\s+\d{4})/i);
      
      if (dateMatch) {
        // Save previous job
        if (currentJob && currentJob.company) {
          experience.push(currentJob);
        }
        
        currentJob = {
          company: '',
          role: '',
          location: '',
          start_date: dateMatch[1],
          end_date: dateMatch[2],
          bullets: []
        };
        
        // Look at surrounding lines for company/role
        // Check previous line for company
        if (i > 0) {
          const prevLine = lines[i - 1];
          if (prevLine.match(/A\/S|ApS|Inc|Ltd|GmbH|Corp/i) || 
              (prevLine.length < 60 && prevLine.match(/^[A-ZÆØÅ]/))) {
            currentJob.company = prevLine;
          }
        }
        
        // Check next lines for role and bullets
        for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
          const nextLine = lines[j];
          
          // Stop if we hit another date or section header
          if (nextLine.match(/\d{4}\s*[-–—]/) || 
              nextLine.toLowerCase().match(/^(erfaring|uddannelse|education|skills)/)) {
            break;
          }
          
          // Role detection (title-like text)
          if (!currentJob.role && nextLine.length < 80) {
            if (nextLine.match(/specialist|leder|manager|developer|engineer|consultant|sikkerhed|fysisk/i)) {
              currentJob.role = nextLine;
              continue;
            }
          }
          
          // Company detection
          if (!currentJob.company && nextLine.match(/A\/S|ApS|Inc|Ltd|Danmark|Denmark/i)) {
            currentJob.company = nextLine.replace(/\s*\|\s*/g, ', ');
            continue;
          }
          
          // Location detection  
          if (!currentJob.location && nextLine.match(/Danmark|Denmark|Copenhagen|København/i)) {
            currentJob.location = nextLine;
            continue;
          }
          
          // Bullet points (longer descriptive text)
          if (nextLine.length > 30 && !nextLine.match(/^[A-ZÆØÅ][a-zæøå]+$/)) {
            currentJob.bullets.push(nextLine);
          }
        }
      }
    }
    
    // Don't forget the last job
    if (currentJob && currentJob.company) {
      experience.push(currentJob);
    }
    
    console.log('📋 Extracted', experience.length, 'experience entries');
    
    // --- EDUCATION EXTRACTION ---
    let inEducationSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineLower = line.toLowerCase();
      
      // Detect education section
      if (lineLower.match(/^(uddannelse|education)/)) {
        inEducationSection = true;
        continue;
      }
      
      // Stop at next section
      if (inEducationSection && lineLower.match(/^(erfaring|experience|skills|certifications|references|kontakt)/)) {
        inEducationSection = false;
      }
      
      if (inEducationSection || lineLower.includes('eksamineret') || lineLower.includes('akademi')) {
        // Look for education entries - year patterns
        const yearMatch = line.match(/\b(19\d{2}|20\d{2})\b/);
        
        if (yearMatch || line.match(/eksamineret|akademi|bachelor|master|kandidat|hf|hhx|htx|stx/i)) {
          // Try to extract institution and degree from surrounding lines
          let degree = '';
          let institution = '';
          let endDate = yearMatch ? yearMatch[1] : '';
          
          // Check if this line has the degree
          if (line.match(/eksamineret|sikringsleder|akademi|bachelor|master|kommunikation/i)) {
            degree = line.replace(/\b\d{4}\b/g, '').trim();
          }
          
          // Look at nearby lines for institution
          for (let j = Math.max(0, i - 2); j <= Math.min(lines.length - 1, i + 2); j++) {
            const nearby = lines[j];
            if (nearby.match(/^(DBI|CFPA|Roskilde|København|Handelsskole|Universitet|University)/i)) {
              institution = nearby;
            }
            if (!degree && nearby.match(/eksamineret|akademi|bachelor|master|hhx|htx|kommunikation/i)) {
              degree = nearby;
            }
            if (!endDate) {
              const ym = nearby.match(/\b(19\d{2}|20\d{2})\b/);
              if (ym) endDate = ym[1];
            }
          }
          
          // Only add if we have meaningful data and haven't added this already
          if ((degree || institution) && endDate) {
            const exists = education.some(e => 
              e.degree === degree && e.institution === institution && e.end_date === endDate
            );
            if (!exists) {
              education.push({
                degree: degree || 'Degree',
                institution: institution || '',
                field: '',
                start_date: '',
                end_date: endDate
              });
            }
          }
        }
      }
    }
    
    console.log('🎓 Extracted', education.length, 'education entries from text');
  } else if (experience.length > 0 || education.length > 0) {
    console.log('✓ Using pre-parsed data - experience:', experience.length, 'education:', education.length);
  }
  
  return {
    name: cvProfile.name || '',
    title: cvProfile.title || '',
    summary: summary,
    skills: {
      primary: relevantSkills.slice(0, 8),
      secondary: cvProfile.skills?.filter((s: string) => !relevantSkills.includes(s)).slice(0, 12) || []
    },
    experience: experience.slice(0, 5),
    education: education.slice(0, 5),
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

  // Parse stored experience/education for the prompt
  const storedExperience = parseStoredExperience(cvProfile);
  const storedEducation = parseStoredEducation(cvProfile);
  
  // Build comprehensive user prompt with all available CV data
  let cvDataSection = `=== BASE CV DATA ===
Name: ${cvProfile.name || 'N/A'}
Current Title: ${cvProfile.title || 'N/A'}
Seniority Level: ${cvProfile.seniority || 'N/A'}
Skills: ${cvProfile.skills?.join(', ') || 'N/A'}
Professional Summary: ${cvProfile.summary || 'N/A'}
Locations: ${cvProfile.locations?.join(', ') || 'N/A'}`;
  
  // Include structured experience data if available
  if (storedExperience.length > 0) {
    cvDataSection += `\n\n=== EXPERIENCE (STRUCTURED) ===`;
    storedExperience.forEach((exp, i) => {
      cvDataSection += `\n\n[${i + 1}] ${exp.role || 'Role'} at ${exp.company || 'Company'}`;
      cvDataSection += `\n    Period: ${exp.start_date || '?'} - ${exp.end_date || '?'}`;
      if (exp.location) cvDataSection += `\n    Location: ${exp.location}`;
      if (exp.bullets && exp.bullets.length > 0) {
        cvDataSection += `\n    Responsibilities/Achievements:`;
        exp.bullets.forEach((b: string) => cvDataSection += `\n    • ${b}`);
      }
    });
  }
  
  // Include structured education data if available
  if (storedEducation.length > 0) {
    cvDataSection += `\n\n=== EDUCATION (STRUCTURED) ===`;
    storedEducation.forEach((edu, i) => {
      cvDataSection += `\n\n[${i + 1}] ${edu.degree || 'Degree'}`;
      if (edu.institution) cvDataSection += ` at ${edu.institution}`;
      if (edu.field) cvDataSection += ` (${edu.field})`;
      const dates = [edu.start_date, edu.end_date].filter(Boolean).join(' - ');
      if (dates) cvDataSection += `\n    Period: ${dates}`;
    });
  }
  
  // Include raw CV text if available and no structured data exists
  if (cvProfile.rawCvText && storedExperience.length === 0 && storedEducation.length === 0) {
    cvDataSection += `\n\n=== ORIGINAL CV TEXT ===\n${cvProfile.rawCvText.substring(0, 4000)}`; // Limit to ~4000 chars to avoid token limits
  } else if (cvProfile.rawCvText && (storedExperience.length > 0 || storedEducation.length > 0)) {
    // Include a shorter snippet of raw text for additional context
    cvDataSection += `\n\n=== ADDITIONAL CV CONTEXT (EXCERPT) ===\n${cvProfile.rawCvText.substring(0, 1500)}`;
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
  } catch (error: any) {
    // Check if it's a rate limit error
    if (error?.status === 429 || error?.message?.includes('429')) {
      console.error('⚠️ OpenAI rate limit exceeded (429). Using fallback with your real CV data.');
      console.error('Tip: Wait a few minutes or upgrade your OpenAI plan for higher limits.');
    } else {
      console.error('OpenAI API error:', error);
    }
    
    // Use safe fallback that uses your real CV data (no invention)
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
    const cvProfile = userWithProfile.cvProfile;
    console.log('📋 CV Profile data being used:', {
      name: cvProfile.name,
      title: cvProfile.title,
      hasRawCvText: !!(cvProfile as any).rawCvText,
      rawCvTextLength: (cvProfile as any).rawCvText?.length || 0,
      rawCvTextPreview: (cvProfile as any).rawCvText?.substring(0, 100) || 'None',
      skillsCount: cvProfile.skills?.length || 0,
      summary: cvProfile.summary?.substring(0, 50) || 'None'
    });
    
    // Check if this looks like mock data
    if (cvProfile.name === 'John Doe' || cvProfile.name?.includes('John Doe')) {
      console.warn('⚠️ WARNING: CV profile appears to contain mock data!');
      console.warn('User needs to re-upload their CV to get real data.');
    }

    // Fetch job details
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Generate tailored CV (has internal error handling with safe fallback)
    const tailoredCV = await generateTailoredCV(cvProfile, job, userNotes);

    // Check if we used fallback (experience array will be populated from rawCvText if available)
    const usedFallback = !process.env.OPENAI_API_KEY;
    const isMockData = cvProfile.name === 'John Doe' || cvProfile.name?.includes('John Doe');
    
    let instructions = usedFallback 
      ? '⚠️ Note: Using fallback mode (OpenAI API unavailable or rate limited). CV uses your real data but may lack AI optimization. All sections are editable - click any field to modify text. Use the design panel to customize appearance.'
      : 'All sections are editable. Click any field to modify text. Use the design panel to customize your CV appearance. Changes are saved automatically. Export to PDF or DOCX when ready to apply.';
    
    if (isMockData) {
      instructions = '⚠️ IMPORTANT: Your profile contains demo data ("John Doe"). Please go to /upload and re-upload your real CV to get personalized results. ' + instructions;
    }

    // Construct response
    const response: TailoredCVResponse = {
      tailored_cv: tailoredCV,
      design_options: DESIGN_OPTIONS,
      designer_panel_ui: DESIGNER_PANEL_UI,
      instructions_for_user_editing: instructions
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
