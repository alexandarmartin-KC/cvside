/**
 * CV Parser V2 - Hybrid Deterministic + AI Approach
 * 
 * This version uses a multi-step process:
 * 1. Extract text from PDF with structure preservation
 * 2. Use regex/patterns to find likely sections (deterministic)
 * 3. Use AI to parse each section independently (focused prompts)
 * 4. Combine results with confidence scores
 */

interface ParsedSection {
  text: string;
  startLine: number;
  endLine: number;
}

interface ExperienceEntry {
  company: string;
  role: string;
  location?: string;
  start_date: string;
  end_date?: string;
  description?: string;
  confidence: 'high' | 'medium' | 'low';
}

interface EducationEntry {
  institution: string;
  degree: string;
  field?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  confidence: 'high' | 'medium' | 'low';
}

/**
 * Step 1: Extract and structure the raw text
 */
export function preprocessCVText(rawText: string): {
  lines: string[];
  cleanText: string;
  sections: Map<string, ParsedSection>;
} {
  // Normalize line endings and clean up
  const normalized = rawText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines
  
  const lines = normalized.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Detect section boundaries
  const sections = new Map<string, ParsedSection>();
  
  const sectionHeaders = [
    { keywords: ['experience', 'work history', 'employment', 'arbejdserfaring', 'erhvervserfaring'], key: 'experience' },
    { keywords: ['education', 'uddannelse', 'academic', 'qualifications'], key: 'education' },
    { keywords: ['skills', 'kompetencer', 'technical skills', 'core competencies'], key: 'skills' },
    { keywords: ['languages', 'sprog'], key: 'languages' },
    { keywords: ['summary', 'profile', 'about', 'om mig'], key: 'summary' },
  ];
  
  let currentSection: string | null = null;
  let sectionStart = 0;
  
  lines.forEach((line, idx) => {
    const lineLower = line.toLowerCase();
    
    // Check if this line is a section header
    for (const section of sectionHeaders) {
      const isHeader = section.keywords.some(keyword => {
        // Check if line is ONLY the keyword (header-like)
        if (lineLower === keyword) return true;
        // Check if line starts with keyword and is short
        if (lineLower.startsWith(keyword) && line.length < 50) return true;
        return false;
      });
      
      if (isHeader) {
        // Save previous section
        if (currentSection && sectionStart < idx) {
          sections.set(currentSection, {
            text: lines.slice(sectionStart, idx).join('\n'),
            startLine: sectionStart,
            endLine: idx - 1
          });
        }
        
        // Start new section
        currentSection = section.key;
        sectionStart = idx + 1;
        break;
      }
    }
  });
  
  // Save last section
  if (currentSection && sectionStart < lines.length) {
    sections.set(currentSection, {
      text: lines.slice(sectionStart).join('\n'),
      startLine: sectionStart,
      endLine: lines.length - 1
    });
  }
  
  console.log('📝 Preprocessed CV:');
  console.log('   Total lines:', lines.length);
  console.log('   Sections found:', Array.from(sections.keys()).join(', '));
  
  return { lines, cleanText: lines.join('\n'), sections };
}

/**
 * Step 2: Pattern-based experience extraction (deterministic)
 */
export function extractExperiencesWithPatterns(text: string): ExperienceEntry[] {
  const experiences: ExperienceEntry[] = [];
  const lines = text.split('\n');
  
  // Pattern 1: "Company Name | Date Range | Role"
  const pattern1 = /^([^|]+)\s*\|\s*(\d{4}\s*[-–]\s*(?:\d{4}|Present|Nu|Current))\s*\|\s*(.+)$/i;
  
  // Pattern 2: "Date Range: Role at Company"
  const pattern2 = /^(\d{4}\s*[-–]\s*(?:\d{4}|Present|Nu|Current))[\s:]+(.+?)\s+(?:at|hos|ved)\s+(.+)$/i;
  
  // Pattern 3: "Role at Company (Date Range)" or "Role, Company (Date Range)"
  const pattern3 = /^(.+?)\s+(?:at|hos|ved|,)\s+(.+?)\s*[\(](\d{4}\s*[-–]\s*(?:\d{4}|Present|Nu|Current))[\)]$/i;
  
  // Pattern 4: Multi-line block detection (Company on one line, Role on next, dates on next)
  const companyIndicators = [
    'A/S', 'ApS', 'Group', 'Inc', 'Ltd', 'Corp', 'Ørsted', 'G4S', 'Securitas', 'ISS',
    'Security', 'Sikkerhed', 'Gruppe', 'Company', 'International', 'Services', 'Solutions'
  ];
  const datePattern = /\d{4}\s*[-–]\s*(?:\d{4}|Present|Nu|Current|Nuværende)/i;
  
  // Pattern 5: Danish format - mentions company in context
  // e.g. "Sikkerhedsansvarlig for Ørsteds hovedkontor"
  const contextPattern = /(?:hos|for|ved|at|i)\s+([A-ZÆØÅ][a-zæøå]+(?:'?s)?|[A-Z][a-zA-Z0-9&]+)/g;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Try pattern 1
    let match = line.match(pattern1);
    if (match) {
      experiences.push({
        company: match[1].trim(),
        role: match[3].trim(),
        start_date: match[2].split(/[-–]/)[0].trim(),
        end_date: match[2].split(/[-–]/)[1]?.trim(),
        confidence: 'high'
      });
      continue;
    }
    
    // Try pattern 2
    match = line.match(pattern2);
    if (match) {
      experiences.push({
        company: match[3].trim(),
        role: match[2].trim(),
        start_date: match[1].split(/[-–]/)[0].trim(),
        end_date: match[1].split(/[-–]/)[1]?.trim(),
        confidence: 'high'
      });
      continue;
    }
    
    // Try pattern 3
    match = line.match(pattern3);
    if (match) {
      experiences.push({
        company: match[2].trim(),
        role: match[1].trim(),
        start_date: match[3].split(/[-–]/)[0].trim(),
        end_date: match[3].split(/[-–]/)[1]?.trim(),
        confidence: 'medium'
      });
      continue;
    }
    
    // Try pattern 4: Multi-line detection
    if (companyIndicators.some(indicator => line.includes(indicator)) || 
        line.length < 50 && line.split(' ').length <= 4) {
      // This might be a company name, check next few lines
      const nextLine = lines[i + 1]?.trim();
      const lineAfter = lines[i + 2]?.trim();
      
      if (nextLine && lineAfter) {
        const dateMatch = lineAfter.match(datePattern);
        if (dateMatch) {
          experiences.push({
            company: line,
            role: nextLine,
            start_date: dateMatch[0].split(/[-–]/)[0].trim(),
            end_date: dateMatch[0].split(/[-–]/)[1]?.trim(),
            confidence: 'medium'
          });
          i += 2; // Skip the lines we just processed
          continue;
        }
      }
    }
  }
  
  console.log('🔍 Pattern-based extraction found', experiences.length, 'experience entries');
  experiences.forEach((exp, idx) => {
    console.log(`   ${idx + 1}. ${exp.role} at ${exp.company} (${exp.start_date} - ${exp.end_date || 'Present'})`);
  });
  
  // If no patterns matched, try intelligent company name detection
  if (experiences.length === 0) {
    console.log('⚠️ No standard patterns found, trying intelligent detection...');
    experiences.push(...extractExperiencesIntelligent(text));
  }
  
  return experiences;
}

/**
 * Intelligent extraction for non-standard CV formats (e.g., Danish CVs without clear structure)
 */
function extractExperiencesIntelligent(text: string): ExperienceEntry[] {
  const experiences: ExperienceEntry[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Known companies (extend this list based on common Danish companies)
  const knownCompanies = [
    'Ørsted', 'G4S', 'Securitas', 'ISS', 'Falck', 'Dansk Facility', 
    'Nets', 'Danske Bank', 'Nordea', 'TDC', 'LEGO', 'Vestas',
    'Maersk', 'Carlsberg', 'Novo Nordisk', 'Coloplast', 'Novozymes'
  ];
  
  // Danish job title keywords
  const jobTitleKeywords = [
    'specialist', 'ansvarlig', 'leder', 'chef', 'koordinator', 'konsulent',
    'manager', 'supervisor', 'officer', 'guard', 'vagt', 'medarbejder',
    'udvikler', 'ingeniør', 'tekniker', 'analytiker', 'rådgiver'
  ];
  
  // Look for company mentions with context
  const companyPattern = /(?:hos|for|ved|at|i)\s+([A-ZÆØÅ][a-zæøå]+(?:'?s)?)/gi;
  const datePattern = /\b(19|20)\d{2}\b/g;
  
  const companyMentions = new Map<string, { line: string; lineIndex: number }[]>();
  
  lines.forEach((line, idx) => {
    // Check for known companies
    knownCompanies.forEach(company => {
      if (line.toLowerCase().includes(company.toLowerCase())) {
        if (!companyMentions.has(company)) {
          companyMentions.set(company, []);
        }
        companyMentions.get(company)!.push({ line, lineIndex: idx });
      }
    });
    
    // Check for company patterns in context
    const matches = line.matchAll(companyPattern);
    for (const match of matches) {
      const possibleCompany = match[1];
      if (possibleCompany && possibleCompany.length > 2) {
        if (!companyMentions.has(possibleCompany)) {
          companyMentions.set(possibleCompany, []);
        }
        companyMentions.get(possibleCompany)!.push({ line, lineIndex: idx });
      }
    }
  });
  
  // Extract experiences from company mentions
  companyMentions.forEach((mentions, company) => {
    // Look for job title in the same line or nearby lines
    const mainMention = mentions[0];
    let role = '';
    
    // Try to extract role from the line mentioning the company
    for (const keyword of jobTitleKeywords) {
      if (mainMention.line.toLowerCase().includes(keyword)) {
        // Extract the phrase containing the keyword
        const words = mainMention.line.split(/\s+/);
        const keywordIndex = words.findIndex(w => w.toLowerCase().includes(keyword));
        if (keywordIndex >= 0) {
          // Take 2-3 words around the keyword
          const start = Math.max(0, keywordIndex - 1);
          const end = Math.min(words.length, keywordIndex + 3);
          role = words.slice(start, end).join(' ');
          break;
        }
      }
    }
    
    if (!role) {
      // Try to find role in nearby lines
      for (let offset = -2; offset <= 2; offset++) {
        const nearbyIndex = mainMention.lineIndex + offset;
        if (nearbyIndex >= 0 && nearbyIndex < lines.length) {
          const nearbyLine = lines[nearbyIndex];
          for (const keyword of jobTitleKeywords) {
            if (nearbyLine.toLowerCase().includes(keyword)) {
              role = nearbyLine;
              break;
            }
          }
          if (role) break;
        }
      }
    }
    
    // Look for dates near the company mention
    let startDate = '';
    let endDate = '';
    for (let offset = -5; offset <= 5; offset++) {
      const nearbyIndex = mainMention.lineIndex + offset;
      if (nearbyIndex >= 0 && nearbyIndex < lines.length) {
        const dates = lines[nearbyIndex].match(datePattern);
        if (dates && dates.length >= 1) {
          startDate = dates[0];
          endDate = dates[1] || 'Present';
          break;
        }
      }
    }
    
    if (role || startDate) {
      experiences.push({
        company: company,
        role: role || 'Position',
        start_date: startDate,
        end_date: endDate || undefined,
        confidence: 'low' as const
      });
      console.log(`   🔍 Intelligent detection: ${role || 'Position'} at ${company} (${startDate || '?'} - ${endDate || 'Present'})`);
    }
  });
  
  return experiences;
}

/**
 * Step 3: Pattern-based education extraction (deterministic)
 */
export function extractEducationWithPatterns(text: string): EducationEntry[] {
  const education: EducationEntry[] = [];
  const lines = text.split('\n');
  
  // Common degree patterns
  const degreePattern = /\b(PhD|Dr\.|Master|MSc|MA|MBA|Bachelor|BSc|BA|Diploma|Certificate|Degree)\b/i;
  const datePattern = /\d{4}\s*[-–]\s*(?:\d{4}|Present|Nu|Current)/i;
  
  // University/School indicators
  const institutionIndicators = [
    'University', 'Universitet', 'College', 'School', 'Academy', 'Institut',
    'Technical', 'Teknisk', 'Business', 'Handelshøjskole'
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Check if line contains degree keyword
    const degreeMatch = line.match(degreePattern);
    if (!degreeMatch) continue;
    
    // Check if line contains institution indicator
    const hasInstitution = institutionIndicators.some(indicator => 
      line.toLowerCase().includes(indicator.toLowerCase())
    );
    
    if (hasInstitution) {
      // Try to extract dates from same line or next line
      const dateMatch = line.match(datePattern) || lines[i + 1]?.match(datePattern);
      
      education.push({
        institution: line.split('|')[0].split(',')[0].split('–')[0].trim(), // Take first part before separators
        degree: degreeMatch[0],
        start_date: dateMatch ? dateMatch[0].split(/[-–]/)[0].trim() : undefined,
        end_date: dateMatch ? dateMatch[0].split(/[-–]/)[1]?.trim() : undefined,
        confidence: dateMatch ? 'high' : 'medium'
      });
    }
  }
  
  console.log('🎓 Pattern-based extraction found', education.length, 'education entries');
  education.forEach((edu, idx) => {
    console.log(`   ${idx + 1}. ${edu.degree} at ${edu.institution}`);
  });
  
  return education;
}

/**
 * Step 4: AI-enhanced extraction for experiences (focused prompt)
 */
export async function enhanceExperiencesWithAI(
  rawText: string, 
  patternBasedExperiences: ExperienceEntry[],
  openAIKey: string
): Promise<ExperienceEntry[]> {
  // If we found experiences with patterns, return those (they're reliable)
  if (patternBasedExperiences.length > 0) {
    console.log('✅ Using pattern-based experiences (deterministic)');
    return patternBasedExperiences;
  }
  
  // Otherwise, use AI with a very focused prompt
  console.log('🤖 No patterns found, trying AI extraction for experiences...');
  
  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({ apiKey: openAIKey });
  
  const prompt = `Extract ONLY work experience from this CV. Return JSON array.

CV Text:
${rawText.substring(0, 8000)}

Return ONLY a JSON array like this:
[
  {"company": "Company Name", "role": "Job Title", "start_date": "2020", "end_date": "2023"},
  {"company": "Another Co", "role": "Position", "start_date": "2018", "end_date": "2020"}
]

Rules:
- ONLY extract if you see a clear company name + role + dates
- start_date and end_date should be years (YYYY) or "Present"
- If unsure, DO NOT include it
- Return empty array [] if no clear experiences found`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0,
      response_format: { type: 'json_object' }
    });
    
    const content = completion.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content);
      const experiences = Array.isArray(parsed) ? parsed : (parsed.experiences || parsed.experience || []);
      console.log('🤖 AI extracted', experiences.length, 'experiences');
      return experiences.map((exp: any) => ({
        ...exp,
        confidence: 'medium' as const
      }));
    }
  } catch (error) {
    console.error('❌ AI extraction failed:', error);
  }
  
  return [];
}
