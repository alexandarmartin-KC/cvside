'use client';

import { useState } from 'react';

type CVData = {
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
};

type CVEditorProps = {
  cv: CVData;
  onChange: (cv: CVData) => void;
  template: string;
  color: string;
};

export function CVEditor({ cv, onChange, template, color }: CVEditorProps) {
  const [editingField, setEditingField] = useState<string | null>(null);

  const updateField = (path: (string | number)[], value: any) => {
    const newCV = JSON.parse(JSON.stringify(cv));
    let current: any = newCV;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
    onChange(newCV);
  };

  const addExperience = () => {
    onChange({
      ...cv,
      experience: [
        ...cv.experience,
        {
          company: 'Company Name',
          role: 'Job Title',
          location: '',
          start_date: '2020',
          end_date: 'Present',
          bullets: ['Achievement or responsibility'],
        },
      ],
    });
  };

  const removeExperience = (index: number) => {
    onChange({
      ...cv,
      experience: cv.experience.filter((_, i) => i !== index),
    });
  };

  const addBullet = (expIndex: number) => {
    const newCV = { ...cv };
    newCV.experience[expIndex].bullets.push('New achievement or responsibility');
    onChange(newCV);
  };

  const removeBullet = (expIndex: number, bulletIndex: number) => {
    const newCV = { ...cv };
    newCV.experience[expIndex].bullets = newCV.experience[expIndex].bullets.filter(
      (_, i) => i !== bulletIndex
    );
    onChange(newCV);
  };

  const getColorClass = (colorId: string) => {
    const colorMap: Record<string, string> = {
      'neutral-black': 'text-gray-900 border-gray-900',
      'navy': 'text-blue-900 border-blue-900',
      'forest': 'text-green-900 border-green-900',
      'burgundy': 'text-red-900 border-red-900',
      'royal-blue': 'text-blue-700 border-blue-700',
      'soft-gold': 'text-yellow-800 border-yellow-800',
    };
    return colorMap[colorId] || colorMap['neutral-black'];
  };

  const colorClass = getColorClass(color);

  // Render different layouts based on template
  const renderTemplate = () => {
    switch (template) {
      case 'modern-two-column':
        return renderTwoColumnLayout();
      case 'technical-compact':
        return renderCompactLayout();
      case 'creative-accent':
        return renderCreativeLayout();
      case 'classic-clean':
      default:
        return renderClassicLayout();
    }
  };

  const renderClassicLayout = () => (
    <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className={`border-b-2 pb-4 mb-6 ${colorClass}`}>
          <input
            type="text"
            value={cv.name}
            onChange={(e) => updateField(['name'], e.target.value)}
            className={`text-3xl font-bold w-full border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 ${colorClass}`}
            placeholder="Your Name"
          />
          <input
            type="text"
            value={cv.title}
            onChange={(e) => updateField(['title'], e.target.value)}
            className="text-xl text-gray-600 w-full border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 mt-1"
            placeholder="Professional Title"
          />
        </div>

        {/* Summary */}
        <div className="mb-6">
          <h2 className={`text-lg font-semibold mb-2 ${colorClass}`}>Professional Summary</h2>
          <textarea
            value={cv.summary}
            onChange={(e) => updateField(['summary'], e.target.value)}
            className="w-full text-gray-700 leading-relaxed border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-3 py-2 min-h-[100px]"
            placeholder="Professional summary..."
          />
        </div>

        {/* Skills */}
        <div className="mb-6">
          <h2 className={`text-lg font-semibold mb-3 ${colorClass}`}>Skills</h2>
          
          {/* Primary Skills */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Primary Skills</h3>
            <div className="flex flex-wrap gap-2">
              {cv.skills.primary.map((skill, idx) => (
                <div key={idx} className="group relative">
                  <input
                    type="text"
                    value={skill}
                    onChange={(e) => {
                      const newSkills = { ...cv.skills };
                      newSkills.primary[idx] = e.target.value;
                      updateField(['skills'], newSkills);
                    }}
                    className="px-3 py-1 bg-blue-100 text-blue-900 text-sm rounded border border-transparent focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                  <button
                    onClick={() => {
                      const newSkills = { ...cv.skills };
                      newSkills.primary = newSkills.primary.filter((_, i) => i !== idx);
                      updateField(['skills'], newSkills);
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newSkills = { ...cv.skills };
                  newSkills.primary.push('New Skill');
                  updateField(['skills'], newSkills);
                }}
                className="px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded border border-blue-200 hover:bg-blue-100 transition"
              >
                + Add Primary Skill
              </button>
            </div>
          </div>
          
          {/* Secondary Skills */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Secondary Skills</h3>
            <div className="flex flex-wrap gap-2">
              {cv.skills.secondary.map((skill, idx) => (
                <div key={idx} className="group relative">
                  <input
                    type="text"
                    value={skill}
                    onChange={(e) => {
                      const newSkills = { ...cv.skills };
                      newSkills.secondary[idx] = e.target.value;
                      updateField(['skills'], newSkills);
                    }}
                    className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded border border-transparent focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => {
                      const newSkills = { ...cv.skills };
                      newSkills.secondary = newSkills.secondary.filter((_, i) => i !== idx);
                      updateField(['skills'], newSkills);
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition text-xs flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newSkills = { ...cv.skills };
                  newSkills.secondary.push('New Skill');
                  updateField(['skills'], newSkills);
                }}
                className="px-3 py-1 bg-gray-50 text-gray-600 text-sm rounded border border-gray-200 hover:bg-gray-100 transition"
              >
                + Add Secondary Skill
              </button>
            </div>
          </div>
        </div>

        {/* Experience */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className={`text-lg font-semibold ${colorClass}`}>Experience</h2>
            <button
              onClick={addExperience}
              className="text-sm px-3 py-1 bg-blue-50 text-blue-600 rounded border border-blue-200 hover:bg-blue-100 transition"
            >
              + Add Position
            </button>
          </div>

          {cv.experience.map((exp, expIdx) => (
            <div key={expIdx} className="mb-6 pb-6 border-b border-gray-200 last:border-0 group relative">
              <button
                onClick={() => removeExperience(expIdx)}
                className="absolute top-0 right-0 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition text-sm flex items-center justify-center"
              >
                ×
              </button>

              <input
                type="text"
                value={exp.role}
                onChange={(e) => updateField(['experience', expIdx, 'role'], e.target.value)}
                className="text-lg font-semibold text-gray-900 w-full border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                placeholder="Job Title"
              />
              
              <div className="flex flex-wrap gap-2 mt-1">
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => updateField(['experience', expIdx, 'company'], e.target.value)}
                  className="text-gray-600 border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                  placeholder="Company"
                />
                <input
                  type="text"
                  value={exp.location || ''}
                  onChange={(e) => updateField(['experience', expIdx, 'location'], e.target.value)}
                  className="text-gray-600 border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                  placeholder="Location"
                />
                <input
                  type="text"
                  value={exp.start_date}
                  onChange={(e) => updateField(['experience', expIdx, 'start_date'], e.target.value)}
                  className="text-gray-600 border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 w-24"
                  placeholder="Start"
                />
                <span className="text-gray-400 self-center">—</span>
                <input
                  type="text"
                  value={exp.end_date}
                  onChange={(e) => updateField(['experience', expIdx, 'end_date'], e.target.value)}
                  className="text-gray-600 border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 w-24"
                  placeholder="End"
                />
              </div>

              <ul className="mt-3 space-y-2">
                {exp.bullets.map((bullet, bulletIdx) => (
                  <li key={bulletIdx} className="flex items-start gap-2 group/bullet">
                    <span className="text-gray-400 mt-1">•</span>
                    <textarea
                      value={bullet}
                      onChange={(e) =>
                        updateField(['experience', expIdx, 'bullets', bulletIdx], e.target.value)
                      }
                      className="flex-1 text-gray-700 border border-transparent focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 min-h-[60px]"
                      placeholder="Achievement or responsibility..."
                    />
                    <button
                      onClick={() => removeBullet(expIdx, bulletIdx)}
                      className="w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover/bullet:opacity-100 transition text-xs flex items-center justify-center flex-shrink-0 mt-1"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => addBullet(expIdx)}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>+ Add bullet point</span>
              </button>
            </div>
          ))}
        </div>

        {/* Education */}
        {cv.education && cv.education.length > 0 && (
          <div className="mb-6">
            <h2 className={`text-lg font-semibold mb-3 ${colorClass}`}>Education</h2>
            {cv.education.map((edu, idx) => (
              <div key={idx} className="mb-3">
                <input
                  type="text"
                  value={edu.degree}
                  onChange={(e) => updateField(['education', idx, 'degree'], e.target.value)}
                  className="font-medium text-gray-900 w-full border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                  placeholder="Degree"
                />
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={edu.institution}
                    onChange={(e) => updateField(['education', idx, 'institution'], e.target.value)}
                    className="text-gray-600 border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 flex-1"
                    placeholder="Institution"
                  />
                  {edu.field && (
                    <input
                      type="text"
                      value={edu.field}
                      onChange={(e) => updateField(['education', idx, 'field'], e.target.value)}
                      className="text-gray-600 border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                      placeholder="Field"
                    />
                  )}
                  <input
                    type="text"
                    value={edu.end_date || ''}
                    onChange={(e) => updateField(['education', idx, 'end_date'], e.target.value)}
                    className="text-gray-600 border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 w-24"
                    placeholder="Year"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Certifications */}
        {cv.certifications && cv.certifications.length > 0 && (
          <div className="mb-6">
            <h2 className={`text-lg font-semibold mb-3 ${colorClass}`}>Certifications</h2>
            <ul className="space-y-1">
              {cv.certifications.map((cert, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="text-gray-400">•</span>
                  <input
                    type="text"
                    value={cert}
                    onChange={(e) => {
                      const newCerts = [...(cv.certifications || [])];
                      newCerts[idx] = e.target.value;
                      updateField(['certifications'], newCerts);
                    }}
                    className="flex-1 text-gray-700 border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                  />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );

  const renderTwoColumnLayout = () => (
    <div className="p-8">
      <div className="grid grid-cols-3 gap-6">
        {/* Left Sidebar */}
        <div className="col-span-1 space-y-6">
          {/* Name/Title in Sidebar */}
          <div>
            <input
              type="text"
              value={cv.name}
              onChange={(e) => updateField(['name'], e.target.value)}
              className={`text-2xl font-bold w-full border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 ${colorClass}`}
              placeholder="Your Name"
            />
            <input
              type="text"
              value={cv.title}
              onChange={(e) => updateField(['title'], e.target.value)}
              className="text-lg text-gray-600 w-full border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 mt-1"
              placeholder="Title"
            />
          </div>

          {/* Skills in Sidebar */}
          <div>
            <h2 className={`text-lg font-semibold mb-3 ${colorClass}`}>Skills</h2>
            <div className="space-y-2">
              {[...cv.skills.primary, ...cv.skills.secondary].map((skill, idx) => (
                <div key={idx} className="text-sm text-gray-700 px-3 py-1 bg-gray-50 rounded">
                  {skill}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Main Content */}
        <div className="col-span-2 space-y-6">
          {/* Summary */}
          <div>
            <h2 className={`text-lg font-semibold mb-2 ${colorClass}`}>Profile</h2>
            <textarea
              value={cv.summary}
              onChange={(e) => updateField(['summary'], e.target.value)}
              className="w-full text-gray-700 leading-relaxed border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-3 py-2 min-h-[80px]"
            />
          </div>

          {/* Experience (same as classic for now) */}
          {renderExperienceSection()}
          {renderEducationSection()}
        </div>
      </div>
    </div>
  );

  const renderCompactLayout = () => (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Compact Header */}
      <div className={`border-b pb-2 mb-4 ${colorClass}`}>
        <input
          type="text"
          value={cv.name}
          onChange={(e) => updateField(['name'], e.target.value)}
          className={`text-2xl font-bold w-full border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 ${colorClass}`}
        />
        <input
          type="text"
          value={cv.title}
          onChange={(e) => updateField(['title'], e.target.value)}
          className="text-base text-gray-600 w-full border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
        />
      </div>

      {/* Compact Skills */}
      <div className="mb-4">
        <h2 className={`text-base font-semibold mb-2 ${colorClass}`}>Skills</h2>
        <div className="flex flex-wrap gap-1 text-sm">
          {[...cv.skills.primary, ...cv.skills.secondary].map((skill, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Compact Experience */}
      <div className="space-y-3">
        {renderExperienceSection(true)}
      </div>
    </div>
  );

  const renderCreativeLayout = () => (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Creative Header with Accent */}
      <div className={`bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6 border-l-4 ${colorClass}`}>
        <input
          type="text"
          value={cv.name}
          onChange={(e) => updateField(['name'], e.target.value)}
          className={`text-3xl font-bold w-full bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 ${colorClass}`}
        />
        <input
          type="text"
          value={cv.title}
          onChange={(e) => updateField(['title'], e.target.value)}
          className="text-xl text-gray-600 w-full bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 mt-1"
        />
      </div>

      {/* Summary with Accent */}
      <div className="mb-6 pl-4 border-l-2 border-blue-200">
        <h2 className={`text-lg font-semibold mb-2 ${colorClass}`}>About</h2>
        <textarea
          value={cv.summary}
          onChange={(e) => updateField(['summary'], e.target.value)}
          className="w-full text-gray-700 leading-relaxed bg-transparent border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-3 py-2 min-h-[100px]"
        />
      </div>

      {/* Rest of content */}
      {renderSkillsSection()}
      {renderExperienceSection()}
      {renderEducationSection()}
    </div>
  );

  const renderSkillsSection = () => (
    <div className="mb-6">
      <h2 className={`text-lg font-semibold mb-3 ${colorClass}`}>Skills</h2>
      
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Primary Skills</h3>
        <div className="flex flex-wrap gap-2">
          {cv.skills.primary.map((skill, idx) => (
            <div key={idx} className="group relative">
              <input
                type="text"
                value={skill}
                onChange={(e) => {
                  const newSkills = { ...cv.skills };
                  newSkills.primary[idx] = e.target.value;
                  updateField(['skills'], newSkills);
                }}
                className="px-3 py-1 bg-blue-100 text-blue-900 text-sm rounded border border-transparent focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              <button
                onClick={() => {
                  const newSkills = { ...cv.skills };
                  newSkills.primary = newSkills.primary.filter((_, i) => i !== idx);
                  updateField(['skills'], newSkills);
                }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition text-xs flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const newSkills = { ...cv.skills };
              newSkills.primary.push('New Skill');
              updateField(['skills'], newSkills);
            }}
            className="px-3 py-1 bg-blue-50 text-blue-600 text-sm rounded border border-blue-200 hover:bg-blue-100 transition"
          >
            + Add
          </button>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Secondary Skills</h3>
        <div className="flex flex-wrap gap-2">
          {cv.skills.secondary.map((skill, idx) => (
            <div key={idx} className="group relative">
              <input
                type="text"
                value={skill}
                onChange={(e) => {
                  const newSkills = { ...cv.skills };
                  newSkills.secondary[idx] = e.target.value;
                  updateField(['skills'], newSkills);
                }}
                className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded border border-transparent focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  const newSkills = { ...cv.skills };
                  newSkills.secondary = newSkills.secondary.filter((_, i) => i !== idx);
                  updateField(['skills'], newSkills);
                }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition text-xs flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderExperienceSection = (compact = false) => (
    <div className={compact ? "mb-4" : "mb-6"}>
      <div className="flex items-center justify-between mb-3">
        <h2 className={`${compact ? 'text-base' : 'text-lg'} font-semibold ${colorClass}`}>Experience</h2>
        {!compact && (
          <button
            onClick={addExperience}
            className="text-sm px-3 py-1 bg-blue-50 text-blue-600 rounded border border-blue-200 hover:bg-blue-100 transition"
          >
            + Add
          </button>
        )}
      </div>

      {cv.experience.map((exp, expIdx) => (
        <div key={expIdx} className={`${compact ? 'mb-3 pb-3' : 'mb-6 pb-6'} border-b border-gray-200 last:border-0 group relative`}>
          {!compact && (
            <button
              onClick={() => removeExperience(expIdx)}
              className="absolute top-0 right-0 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition text-sm flex items-center justify-center"
            >
              ×
            </button>
          )}

          <input
            type="text"
            value={exp.role}
            onChange={(e) => updateField(['experience', expIdx, 'role'], e.target.value)}
            className={`${compact ? 'text-base' : 'text-lg'} font-semibold text-gray-900 w-full border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1`}
          />
          
          <div className="flex flex-wrap gap-2 mt-1 text-sm">
            <input
              type="text"
              value={exp.company}
              onChange={(e) => updateField(['experience', expIdx, 'company'], e.target.value)}
              className="text-gray-600 border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            />
            <input
              type="text"
              value={exp.start_date}
              onChange={(e) => updateField(['experience', expIdx, 'start_date'], e.target.value)}
              className="text-gray-600 border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 w-20"
            />
            <span className="text-gray-400 self-center">—</span>
            <input
              type="text"
              value={exp.end_date}
              onChange={(e) => updateField(['experience', expIdx, 'end_date'], e.target.value)}
              className="text-gray-600 border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 w-20"
            />
          </div>

          <ul className={`${compact ? 'mt-1 space-y-1' : 'mt-3 space-y-2'}`}>
            {exp.bullets.map((bullet, bulletIdx) => (
              <li key={bulletIdx} className="flex items-start gap-2 group/bullet">
                <span className="text-gray-400 mt-1 text-sm">•</span>
                <textarea
                  value={bullet}
                  onChange={(e) => updateField(['experience', expIdx, 'bullets', bulletIdx], e.target.value)}
                  className={`flex-1 text-gray-700 ${compact ? 'text-sm' : ''} border border-transparent focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 min-h-[${compact ? '40' : '60'}px]`}
                />
                {!compact && (
                  <button
                    onClick={() => removeBullet(expIdx, bulletIdx)}
                    className="w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover/bullet:opacity-100 transition text-xs flex items-center justify-center flex-shrink-0 mt-1"
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>

          {!compact && (
            <button
              onClick={() => addBullet(expIdx)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700"
            >
              + Add bullet
            </button>
          )}
        </div>
      ))}
    </div>
  );

  const renderEducationSection = () => (
    <>
      {cv.education && cv.education.length > 0 && (
        <div className="mb-6">
          <h2 className={`text-lg font-semibold mb-3 ${colorClass}`}>Education</h2>
          {cv.education.map((edu, idx) => (
            <div key={idx} className="mb-3">
              <input
                type="text"
                value={edu.degree}
                onChange={(e) => updateField(['education', idx, 'degree'], e.target.value)}
                className="font-medium text-gray-900 w-full border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
              />
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={edu.institution}
                  onChange={(e) => updateField(['education', idx, 'institution'], e.target.value)}
                  className="text-gray-600 border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 flex-1"
                />
                {edu.end_date && (
                  <input
                    type="text"
                    value={edu.end_date}
                    onChange={(e) => updateField(['education', idx, 'end_date'], e.target.value)}
                    className="text-gray-600 border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 w-24"
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      {/* Preview Banner */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="text-sm text-gray-700 font-medium">CV Preview - Click to edit</span>
        </div>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {template.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
        </span>
      </div>

      {/* Render selected template */}
      {renderTemplate()}
    </div>
  );
}
