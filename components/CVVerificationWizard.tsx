'use client';

import { useState } from 'react';
import { CheckCircleIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Experience {
  id?: string;
  company: string | null;
  role: string | null;
  location?: string | null;
  start_date: string | null;
  end_date: string | null;
  date_confidence?: string;
  bullets?: string[];
  source_snippet?: string;
}

interface Education {
  id?: string;
  institution: string | null;
  degree: string | null;
  field?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  details?: string[];
  source_snippet?: string;
}

interface Language {
  name: string;
  proficiency?: 'Native' | 'Fluent' | 'Intermediate' | 'Basic' | null;
}

interface CVProfile {
  name: string | null;
  name_confidence?: string;
  title?: string | null;
  summary?: string | null;
  contact?: {
    email?: string | null;
    phone?: string | null;
    location?: string | null;
    linkedin?: string | null;
  };
  skills?: string[];
  languages?: (string | Language)[];
  experience?: Experience[];
  education?: Education[];
}

interface CVVerificationWizardProps {
  cvProfile: CVProfile;
  onComplete: (verifiedProfile: CVProfile) => void;
  onCancel: () => void;
}

type EditingSection = 'name' | 'title' | 'contact' | `experience-${number}` | `education-${number}` | 'skills' | 'languages' | null;

export default function CVVerificationWizard({ 
  cvProfile, 
  onComplete, 
  onCancel 
}: CVVerificationWizardProps) {
  const [profile, setProfile] = useState<CVProfile>(cvProfile);
  const [editingSection, setEditingSection] = useState<EditingSection>(null);
  const [verifiedSections, setVerifiedSections] = useState<Set<string>>(new Set());

  const markAsVerified = (section: string) => {
    setVerifiedSections(prev => new Set(prev).add(section));
  };

  const removeExperience = (index: number) => {
    setProfile(prev => ({
      ...prev,
      experience: prev.experience?.filter((_, i) => i !== index)
    }));
  };

  const removeEducation = (index: number) => {
    setProfile(prev => ({
      ...prev,
      education: prev.education?.filter((_, i) => i !== index)
    }));
  };

  const handleComplete = () => {
    onComplete(profile);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Minimal Header */}
        <div className="px-8 py-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Review Your Profile</h2>
              <p className="text-sm text-gray-500 mt-1">Verify and edit information from your CV</p>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Content - Scrollable Overview */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <div className="space-y-6 max-w-3xl">
            
            {/* Basic Information */}
            <Section
              title="Basic Information"
              verified={verifiedSections.has('basic')}
              onVerify={() => markAsVerified('basic')}
            >
              <InfoRow
                label="Name"
                value={profile.name}
                isEditing={editingSection === 'name'}
                onEdit={() => setEditingSection('name')}
                onSave={(value) => {
                  setProfile(prev => ({ ...prev, name: value }));
                  setEditingSection(null);
                  markAsVerified('basic');
                }}
                onCancel={() => setEditingSection(null)}
                lowConfidence={profile.name_confidence === 'low'}
              />
              {profile.title && (
                <InfoRow
                  label="Professional Title"
                  value={profile.title}
                  isEditing={editingSection === 'title'}
                  onEdit={() => setEditingSection('title')}
                  onSave={(value) => {
                    setProfile(prev => ({ ...prev, title: value }));
                    setEditingSection(null);
                    markAsVerified('basic');
                  }}
                  onCancel={() => setEditingSection(null)}
                />
              )}
            </Section>

            {/* Contact Information */}
            {(profile.contact?.email || profile.contact?.phone || profile.contact?.location) && (
              <Section
                title="Contact Information"
                verified={verifiedSections.has('contact')}
                onVerify={() => markAsVerified('contact')}
              >
                <ContactInfo
                  contact={profile.contact}
                  isEditing={editingSection === 'contact'}
                  onEdit={() => setEditingSection('contact')}
                  onSave={(value) => {
                    setProfile(prev => ({ ...prev, contact: value }));
                    setEditingSection(null);
                    markAsVerified('contact');
                  }}
                  onCancel={() => setEditingSection(null)}
                />
              </Section>
            )}

            {/* Work Experience */}
            {profile.experience && profile.experience.length > 0 && (
              <Section
                title="Work Experience"
                verified={verifiedSections.has('experience')}
                onVerify={() => markAsVerified('experience')}
              >
                <div className="space-y-4">
                  {profile.experience.map((exp, index) => (
                    <ExperienceCard
                      key={index}
                      experience={exp}
                      isEditing={editingSection === `experience-${index}`}
                      onEdit={() => setEditingSection(`experience-${index}`)}
                      onSave={(value) => {
                        setProfile(prev => ({
                          ...prev,
                          experience: prev.experience?.map((e, i) => i === index ? value : e)
                        }));
                        setEditingSection(null);
                        markAsVerified('experience');
                      }}
                      onRemove={() => removeExperience(index)}
                      onCancel={() => setEditingSection(null)}
                    />
                  ))}
                </div>
              </Section>
            )}

            {/* Education */}
            {profile.education && profile.education.length > 0 && (
              <Section
                title="Education"
                verified={verifiedSections.has('education')}
                onVerify={() => markAsVerified('education')}
              >
                <div className="space-y-4">
                  {profile.education.map((edu, index) => (
                    <EducationCard
                      key={index}
                      education={edu}
                      isEditing={editingSection === `education-${index}`}
                      onEdit={() => setEditingSection(`education-${index}`)}
                      onSave={(value) => {
                        setProfile(prev => ({
                          ...prev,
                          education: prev.education?.map((e, i) => i === index ? value : e)
                        }));
                        setEditingSection(null);
                        markAsVerified('education');
                      }}
                      onRemove={() => removeEducation(index)}
                      onCancel={() => setEditingSection(null)}
                    />
                  ))}
                </div>
              </Section>
            )}

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <Section
                title="Skills"
                verified={verifiedSections.has('skills')}
                onVerify={() => markAsVerified('skills')}
              >
                <SkillsList
                  skills={profile.skills}
                  isEditing={editingSection === 'skills'}
                  onEdit={() => setEditingSection('skills')}
                  onSave={(value) => {
                    setProfile(prev => ({ ...prev, skills: value }));
                    setEditingSection(null);
                    markAsVerified('skills');
                  }}
                  onCancel={() => setEditingSection(null)}
                />
              </Section>
            )}

            {/* Languages */}
            {profile.languages && profile.languages.length > 0 && (
              <Section
                title="Languages"
                verified={verifiedSections.has('languages')}
                onVerify={() => markAsVerified('languages')}
              >
                <LanguagesList
                  languages={profile.languages}
                  isEditing={editingSection === 'languages'}
                  onEdit={() => setEditingSection('languages')}
                  onSave={(value) => {
                    setProfile(prev => ({ ...prev, languages: value }));
                    setEditingSection(null);
                    markAsVerified('languages');
                  }}
                  onCancel={() => setEditingSection(null)}
                />
              </Section>
            )}

          </div>
        </div>
        
        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <button
              onClick={onCancel}
              className="px-5 py-2.5 text-gray-600 hover:text-gray-800 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleComplete}
              className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              Confirm & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Section wrapper component
function Section({ 
  title, 
  verified, 
  onVerify, 
  children 
}: { 
  title: string; 
  verified: boolean; 
  onVerify: () => void; 
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {verified && (
          <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
            <CheckCircleIcon className="w-5 h-5" />
            <span>Verified</span>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

// Info Row component for simple key-value pairs
function InfoRow({
  label,
  value,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  lowConfidence
}: {
  label: string;
  value: string | null;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (value: string) => void;
  onCancel: () => void;
  lowConfidence?: boolean;
}) {
  const [editValue, setEditValue] = useState(value || '');

  if (isEditing) {
    return (
      <div className="py-3 border-t border-gray-100 first:border-0">
        <label className="block text-sm font-medium text-gray-600 mb-2">{label}</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
          <button
            onClick={() => onSave(editValue)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-3 border-t border-gray-100 first:border-0 flex items-center justify-between group">
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-600 mb-1">{label}</div>
        <div className="text-base text-gray-900">
          {value || <span className="text-gray-400 italic">Not provided</span>}
        </div>
        {lowConfidence && (
          <div className="text-xs text-amber-600 mt-1">⚠️ Low confidence - please verify</div>
        )}
      </div>
      <button
        onClick={onEdit}
        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-blue-600 transition-all"
        aria-label="Edit"
      >
        <PencilIcon className="w-4 h-4" />
      </button>
    </div>
  );
}

// Contact Info component
function ContactInfo({
  contact,
  isEditing,
  onEdit,
  onSave,
  onCancel
}: {
  contact?: CVProfile['contact'];
  isEditing: boolean;
  onEdit: () => void;
  onSave: (value: CVProfile['contact']) => void;
  onCancel: () => void;
}) {
  const [editValue, setEditValue] = useState(contact || {});

  if (isEditing) {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Email</label>
          <input
            type="email"
            value={editValue?.email || ''}
            onChange={(e) => setEditValue({ ...editValue, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="your@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Phone</label>
          <input
            type="tel"
            value={editValue?.phone || ''}
            onChange={(e) => setEditValue({ ...editValue, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="+1 234 567 8900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Location</label>
          <input
            type="text"
            value={editValue?.location || ''}
            onChange={(e) => setEditValue({ ...editValue, location: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="City, Country"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onSave(editValue)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 group">
      {contact?.email && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">📧</span>
          <span className="text-gray-900">{contact.email}</span>
        </div>
      )}
      {contact?.phone && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">📱</span>
          <span className="text-gray-900">{contact.phone}</span>
        </div>
      )}
      {contact?.location && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">📍</span>
          <span className="text-gray-900">{contact.location}</span>
        </div>
      )}
      <button
        onClick={onEdit}
        className="opacity-0 group-hover:opacity-100 mt-2 text-sm text-blue-600 hover:text-blue-700 transition-all font-medium flex items-center gap-1"
      >
        <PencilIcon className="w-4 h-4" />
        Edit contact info
      </button>
    </div>
  );
}

// Experience Card component
function ExperienceCard({
  experience,
  isEditing,
  onEdit,
  onSave,
  onRemove,
  onCancel
}: {
  experience: Experience;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (value: Experience) => void;
  onRemove: () => void;
  onCancel: () => void;
}) {
  const [editValue, setEditValue] = useState(experience);

  if (isEditing) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Company</label>
          <input
            type="text"
            value={editValue?.company || ''}
            onChange={(e) => setEditValue({ ...editValue, company: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Job Title</label>
          <input
            type="text"
            value={editValue?.role || ''}
            onChange={(e) => setEditValue({ ...editValue, role: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Start Date</label>
            <input
              type="text"
              value={editValue?.start_date || ''}
              onChange={(e) => setEditValue({ ...editValue, start_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Nov 2020"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">End Date</label>
            <input
              type="text"
              value={editValue?.end_date || ''}
              onChange={(e) => setEditValue({ ...editValue, end_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Present"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Location (optional)</label>
          <input
            type="text"
            value={editValue?.location || ''}
            onChange={(e) => setEditValue({ ...editValue, location: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onSave(editValue)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const dateRange = experience.start_date && experience.end_date 
    ? `${experience.start_date} - ${experience.end_date}`
    : experience.start_date 
    ? `${experience.start_date} - Present`
    : experience.end_date 
    ? `Until ${experience.end_date}`
    : '';

  return (
    <div className="bg-gray-50 rounded-lg p-4 group hover:bg-gray-100 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{experience.company || 'Unknown Company'}</h4>
          <p className="text-sm text-gray-700 mt-0.5">{experience.role || 'Unknown Role'}</p>
          {dateRange && <p className="text-xs text-gray-500 mt-1">{dateRange}</p>}
          {experience.location && <p className="text-xs text-gray-500">📍 {experience.location}</p>}
          {experience.bullets && experience.bullets.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm text-gray-600">
              {experience.bullets.slice(0, 3).map((bullet, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-gray-400 mt-0.5">•</span>
                  <span className="flex-1">{bullet}</span>
                </li>
              ))}
              {experience.bullets.length > 3 && (
                <li className="text-xs text-gray-400 italic">+ {experience.bullets.length - 3} more...</li>
              )}
            </ul>
          )}
          {experience.date_confidence === 'low' && (
            <p className="text-xs text-amber-600 mt-1">⚠️ Low confidence dates</p>
          )}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
            aria-label="Edit"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
            aria-label="Remove"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Education Card component
function EducationCard({
  education,
  isEditing,
  onEdit,
  onSave,
  onRemove,
  onCancel
}: {
  education: Education;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (value: Education) => void;
  onRemove: () => void;
  onCancel: () => void;
}) {
  const [editValue, setEditValue] = useState(education);

  if (isEditing) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Institution</label>
          <input
            type="text"
            value={editValue?.institution || ''}
            onChange={(e) => setEditValue({ ...editValue, institution: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Degree</label>
          <input
            type="text"
            value={editValue?.degree || ''}
            onChange={(e) => setEditValue({ ...editValue, degree: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1.5">Field of Study</label>
          <input
            type="text"
            value={editValue?.field || ''}
            onChange={(e) => setEditValue({ ...editValue, field: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">Start Date</label>
            <input
              type="text"
              value={editValue?.start_date || ''}
              onChange={(e) => setEditValue({ ...editValue, start_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">End Date</label>
            <input
              type="text"
              value={editValue?.end_date || ''}
              onChange={(e) => setEditValue({ ...editValue, end_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onSave(editValue)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  const dateRange = education.start_date && education.end_date 
    ? `${education.start_date} - ${education.end_date}`
    : education.start_date || education.end_date || '';

  return (
    <div className="bg-gray-50 rounded-lg p-4 group hover:bg-gray-100 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{education.institution || 'Unknown Institution'}</h4>
          <p className="text-sm text-gray-700 mt-0.5">
            {education.degree || 'Unknown Degree'}
            {education.field && ` in ${education.field}`}
          </p>
          {dateRange && <p className="text-xs text-gray-500 mt-1">{dateRange}</p>}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
            aria-label="Edit"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onRemove}
            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
            aria-label="Remove"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Skills List component
function SkillsList({
  skills,
  isEditing,
  onEdit,
  onSave,
  onCancel
}: {
  skills: string[];
  isEditing: boolean;
  onEdit: () => void;
  onSave: (value: string[]) => void;
  onCancel: () => void;
}) {
  const [editValue, setEditValue] = useState(skills);
  const [newSkill, setNewSkill] = useState('');

  const handleAddSkill = () => {
    if (newSkill.trim() && !editValue.includes(newSkill.trim())) {
      setEditValue([...editValue, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (index: number) => {
    setEditValue(editValue.filter((_, i) => i !== index));
  };

  if (isEditing) {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add a skill..."
          />
          <button
            onClick={handleAddSkill}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {editValue?.map((skill, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm"
            >
              {skill}
              <button
                onClick={() => handleRemoveSkill(idx)}
                className="ml-1 text-blue-400 hover:text-blue-600 font-bold"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onSave(editValue)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group">
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, idx) => (
          <span
            key={idx}
            className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
          >
            {skill}
          </span>
        ))}
      </div>
      <button
        onClick={onEdit}
        className="opacity-0 group-hover:opacity-100 mt-3 text-sm text-blue-600 hover:text-blue-700 transition-all font-medium flex items-center gap-1"
      >
        <PencilIcon className="w-4 h-4" />
        Edit skills
      </button>
    </div>
  );
}

// Languages List component
function LanguagesList({
  languages,
  isEditing,
  onEdit,
  onSave,
  onCancel
}: {
  languages: (string | Language)[];
  isEditing: boolean;
  onEdit: () => void;
  onSave: (value: (string | Language)[]) => void;
  onCancel: () => void;
}) {
  // Normalize languages to Language objects
  const normalizedLanguages = languages.map(lang => 
    typeof lang === 'string' ? { name: lang, proficiency: null } : lang
  );
  
  const [editValue, setEditValue] = useState<Language[]>(normalizedLanguages);
  const [newLanguage, setNewLanguage] = useState('');
  const [newProficiency, setNewProficiency] = useState<Language['proficiency']>('Fluent');

  const handleAddLanguage = () => {
    if (newLanguage.trim() && !editValue.some(l => l.name.toLowerCase() === newLanguage.trim().toLowerCase())) {
      setEditValue([...editValue, { name: newLanguage.trim(), proficiency: newProficiency }]);
      setNewLanguage('');
      setNewProficiency('Fluent');
    }
  };

  const handleRemoveLanguage = (index: number) => {
    setEditValue(editValue.filter((_, i) => i !== index));
  };

  const handleUpdateProficiency = (index: number, proficiency: Language['proficiency']) => {
    const updated = [...editValue];
    updated[index] = { ...updated[index], proficiency };
    setEditValue(updated);
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newLanguage}
            onChange={(e) => setNewLanguage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddLanguage()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add a language..."
          />
          <select
            value={newProficiency || ''}
            onChange={(e) => setNewProficiency(e.target.value as Language['proficiency'])}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Native">Native</option>
            <option value="Fluent">Fluent</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Basic">Basic</option>
          </select>
          <button
            onClick={handleAddLanguage}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            Add
          </button>
        </div>
        <div className="space-y-2">
          {editValue?.map((lang, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-purple-50 rounded-lg p-3">
              <span className="flex-1 text-purple-900 font-medium">{lang.name}</span>
              <select
                value={lang.proficiency || ''}
                onChange={(e) => handleUpdateProficiency(idx, e.target.value as Language['proficiency'])}
                className="px-3 py-1.5 text-sm border border-purple-200 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
              >
                <option value="">Not specified</option>
                <option value="Native">Native</option>
                <option value="Fluent">Fluent</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Basic">Basic</option>
              </select>
              <button
                onClick={() => handleRemoveLanguage(idx)}
                className="p-1.5 text-purple-400 hover:text-purple-600 font-bold"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onSave(editValue)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group">
      <div className="space-y-2">
        {normalizedLanguages.map((lang, idx) => (
          <div key={idx} className="flex items-center justify-between bg-purple-50 rounded-lg px-4 py-2.5">
            <span className="text-purple-900 font-medium">{lang.name}</span>
            {lang.proficiency && (
              <span className="text-xs text-purple-600 bg-purple-100 px-2.5 py-1 rounded-full">
                {lang.proficiency}
              </span>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={onEdit}
        className="opacity-0 group-hover:opacity-100 mt-3 text-sm text-blue-600 hover:text-blue-700 transition-all font-medium flex items-center gap-1"
      >
        <PencilIcon className="w-4 h-4" />
        Edit languages
      </button>
    </div>
  );
}
