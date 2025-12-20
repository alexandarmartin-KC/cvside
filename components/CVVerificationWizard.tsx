'use client';

import { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, PencilIcon, ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';

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
  languages?: string[];
  experience?: Experience[];
  education?: Education[];
}

interface CVVerificationWizardProps {
  cvProfile: CVProfile;
  onComplete: (verifiedProfile: CVProfile) => void;
  onCancel: () => void;
}

type WizardStep = 
  | { type: 'name' }
  | { type: 'title' }
  | { type: 'contact' }
  | { type: 'experience'; index: number }
  | { type: 'education'; index: number }
  | { type: 'skills' }
  | { type: 'languages' }
  | { type: 'summary' };

export default function CVVerificationWizard({ 
  cvProfile, 
  onComplete, 
  onCancel 
}: CVVerificationWizardProps) {
  const [profile, setProfile] = useState<CVProfile>(cvProfile);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<any>(null);
  
  // Build dynamic steps based on what data exists
  const steps: WizardStep[] = [];
  
  // Always verify name
  steps.push({ type: 'name' });
  
  // Title if present
  if (profile.title) {
    steps.push({ type: 'title' });
  }
  
  // Contact info
  if (profile.contact?.email || profile.contact?.phone || profile.contact?.location) {
    steps.push({ type: 'contact' });
  }
  
  // Each experience entry
  (profile.experience || []).forEach((_, index) => {
    steps.push({ type: 'experience', index });
  });
  
  // Each education entry
  (profile.education || []).forEach((_, index) => {
    steps.push({ type: 'education', index });
  });
  
  // Skills if present
  if (profile.skills && profile.skills.length > 0) {
    steps.push({ type: 'skills' });
  }
  
  // Languages if present
  if (profile.languages && profile.languages.length > 0) {
    steps.push({ type: 'languages' });
  }
  
  const currentStep = steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / steps.length) * 100;
  
  const handleConfirm = () => {
    setIsEditing(false);
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onComplete(profile);
    }
  };
  
  const handleEdit = () => {
    setIsEditing(true);
    // Initialize edit value based on current step
    if (currentStep.type === 'name') {
      setEditValue(profile.name || '');
    } else if (currentStep.type === 'title') {
      setEditValue(profile.title || '');
    } else if (currentStep.type === 'contact') {
      setEditValue({ ...profile.contact });
    } else if (currentStep.type === 'experience') {
      setEditValue({ ...profile.experience![currentStep.index] });
    } else if (currentStep.type === 'education') {
      setEditValue({ ...profile.education![currentStep.index] });
    } else if (currentStep.type === 'skills') {
      setEditValue([...(profile.skills || [])]);
    } else if (currentStep.type === 'languages') {
      setEditValue([...(profile.languages || [])]);
    }
  };
  
  const handleSaveEdit = () => {
    if (currentStep.type === 'name') {
      setProfile(prev => ({ ...prev, name: editValue }));
    } else if (currentStep.type === 'title') {
      setProfile(prev => ({ ...prev, title: editValue }));
    } else if (currentStep.type === 'contact') {
      setProfile(prev => ({ ...prev, contact: editValue }));
    } else if (currentStep.type === 'experience') {
      setProfile(prev => ({
        ...prev,
        experience: prev.experience?.map((exp, i) => 
          i === currentStep.index ? editValue : exp
        )
      }));
    } else if (currentStep.type === 'education') {
      setProfile(prev => ({
        ...prev,
        education: prev.education?.map((edu, i) => 
          i === currentStep.index ? editValue : edu
        )
      }));
    } else if (currentStep.type === 'skills') {
      setProfile(prev => ({ ...prev, skills: editValue }));
    } else if (currentStep.type === 'languages') {
      setProfile(prev => ({ ...prev, languages: editValue }));
    }
    setIsEditing(false);
    handleConfirm();
  };
  
  const handleBack = () => {
    setIsEditing(false);
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };
  
  const handleSkip = () => {
    // Skip this item (remove from profile)
    if (currentStep.type === 'experience') {
      setProfile(prev => ({
        ...prev,
        experience: prev.experience?.filter((_, i) => i !== currentStep.index)
      }));
    } else if (currentStep.type === 'education') {
      setProfile(prev => ({
        ...prev,
        education: prev.education?.filter((_, i) => i !== currentStep.index)
      }));
    }
    handleConfirm();
  };

  const renderStepContent = () => {
    if (!currentStep) return null;
    
    switch (currentStep.type) {
      case 'name':
        return (
          <NameStep
            name={profile.name}
            confidence={profile.name_confidence}
            isEditing={isEditing}
            editValue={editValue}
            setEditValue={setEditValue}
          />
        );
      
      case 'title':
        return (
          <TitleStep
            title={profile.title}
            isEditing={isEditing}
            editValue={editValue}
            setEditValue={setEditValue}
          />
        );
      
      case 'contact':
        return (
          <ContactStep
            contact={profile.contact}
            isEditing={isEditing}
            editValue={editValue}
            setEditValue={setEditValue}
          />
        );
      
      case 'experience':
        const exp = profile.experience![currentStep.index];
        return (
          <ExperienceStep
            experience={exp}
            index={currentStep.index}
            total={profile.experience!.length}
            isEditing={isEditing}
            editValue={editValue}
            setEditValue={setEditValue}
          />
        );
      
      case 'education':
        const edu = profile.education![currentStep.index];
        return (
          <EducationStep
            education={edu}
            index={currentStep.index}
            total={profile.education!.length}
            isEditing={isEditing}
            editValue={editValue}
            setEditValue={setEditValue}
          />
        );
      
      case 'skills':
        return (
          <SkillsStep
            skills={profile.skills || []}
            isEditing={isEditing}
            editValue={editValue}
            setEditValue={setEditValue}
          />
        );
      
      case 'languages':
        return (
          <LanguagesStep
            languages={profile.languages || []}
            isEditing={isEditing}
            editValue={editValue}
            setEditValue={setEditValue}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Verify Your CV Information</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircleIcon className="w-6 h-6" />
            </button>
          </div>
          
          {/* Progress bar */}
          <div className="relative">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Step {currentStepIndex + 1} of {steps.length}
            </p>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderStepContent()}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          {isEditing ? (
            <div className="flex gap-3">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Save & Continue
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              {currentStepIndex > 0 && (
                <button
                  onClick={handleBack}
                  className="px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-1"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                  Back
                </button>
              )}
              
              {(currentStep?.type === 'experience' || currentStep?.type === 'education') && (
                <button
                  onClick={handleSkip}
                  className="px-4 py-2.5 text-gray-500 hover:text-gray-700 transition-colors font-medium"
                >
                  Skip this
                </button>
              )}
              
              <div className="flex-1" />
              
              <button
                onClick={handleEdit}
                className="px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
              >
                <PencilIcon className="w-4 h-4" />
                Edit
              </button>
              
              <button
                onClick={handleConfirm}
                className="px-6 py-2.5 text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2"
              >
                <CheckIcon className="w-4 h-4" />
                {currentStepIndex === steps.length - 1 ? 'Complete' : 'Confirm'}
                {currentStepIndex < steps.length - 1 && <ChevronRightIcon className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Individual step components

function NameStep({ name, confidence, isEditing, editValue, setEditValue }: {
  name: string | null;
  confidence?: string;
  isEditing: boolean;
  editValue: any;
  setEditValue: (v: any) => void;
}) {
  if (isEditing) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">What is your name?</h3>
        <input
          type="text"
          value={editValue || ''}
          onChange={(e) => setEditValue(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
          placeholder="Enter your full name"
          autoFocus
        />
      </div>
    );
  }
  
  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
        <span className="text-2xl">👤</span>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Based on your CV, we believe your name is:
        </h3>
        <p className="text-3xl font-bold text-blue-600">{name || 'Not detected'}</p>
        {confidence === 'low' && (
          <p className="text-sm text-amber-600 mt-2">
            ⚠️ We weren't very confident about this - please verify
          </p>
        )}
      </div>
      <p className="text-gray-500">Is this correct?</p>
    </div>
  );
}

function TitleStep({ title, isEditing, editValue, setEditValue }: {
  title: string | null | undefined;
  isEditing: boolean;
  editValue: any;
  setEditValue: (v: any) => void;
}) {
  if (isEditing) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">What is your professional title?</h3>
        <input
          type="text"
          value={editValue || ''}
          onChange={(e) => setEditValue(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
          placeholder="e.g., Senior Software Engineer"
          autoFocus
        />
      </div>
    );
  }
  
  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
        <span className="text-2xl">💼</span>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Your professional title is:
        </h3>
        <p className="text-2xl font-bold text-purple-600">{title || 'Not specified'}</p>
      </div>
      <p className="text-gray-500">Is this correct?</p>
    </div>
  );
}

function ContactStep({ contact, isEditing, editValue, setEditValue }: {
  contact?: CVProfile['contact'];
  isEditing: boolean;
  editValue: any;
  setEditValue: (v: any) => void;
}) {
  if (isEditing) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Update your contact information</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={editValue?.email || ''}
              onChange={(e) => setEditValue({ ...editValue, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="your@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={editValue?.phone || ''}
              onChange={(e) => setEditValue({ ...editValue, phone: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="+1 234 567 8900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              value={editValue?.location || ''}
              onChange={(e) => setEditValue({ ...editValue, location: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="City, Country"
            />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <span className="text-2xl">📧</span>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          We found this contact information:
        </h3>
        <div className="space-y-2 text-left max-w-sm mx-auto">
          {contact?.email && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-400">📧</span>
              <span className="font-medium">{contact.email}</span>
            </div>
          )}
          {contact?.phone && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-400">📱</span>
              <span className="font-medium">{contact.phone}</span>
            </div>
          )}
          {contact?.location && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-400">📍</span>
              <span className="font-medium">{contact.location}</span>
            </div>
          )}
        </div>
      </div>
      <p className="text-gray-500">Is this correct?</p>
    </div>
  );
}

function ExperienceStep({ experience, index, total, isEditing, editValue, setEditValue }: {
  experience: Experience;
  index: number;
  total: number;
  isEditing: boolean;
  editValue: any;
  setEditValue: (v: any) => void;
}) {
  if (isEditing) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Edit work experience</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <input
              type="text"
              value={editValue?.company || ''}
              onChange={(e) => setEditValue({ ...editValue, company: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
            <input
              type="text"
              value={editValue?.role || ''}
              onChange={(e) => setEditValue({ ...editValue, role: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="text"
                value={editValue?.start_date || ''}
                onChange={(e) => setEditValue({ ...editValue, start_date: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Nov 2020"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="text"
                value={editValue?.end_date || ''}
                onChange={(e) => setEditValue({ ...editValue, end_date: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Present"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
            <input
              type="text"
              value={editValue?.location || ''}
              onChange={(e) => setEditValue({ ...editValue, location: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    );
  }
  
  const dateRange = experience.start_date && experience.end_date 
    ? `from ${experience.start_date} to ${experience.end_date}`
    : experience.start_date 
    ? `starting ${experience.start_date}`
    : experience.end_date 
    ? `until ${experience.end_date}`
    : '';
  
  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
        <span className="text-2xl">🏢</span>
      </div>
      <div className="text-sm text-gray-500">
        Work Experience {index + 1} of {total}
      </div>
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Is it correct that you worked for:
        </h3>
        <div className="bg-gray-50 rounded-xl p-6 text-left max-w-md mx-auto">
          <p className="text-2xl font-bold text-indigo-600 mb-1">
            {experience.company || 'Unknown Company'}
          </p>
          <p className="text-lg text-gray-700 mb-2">
            as <span className="font-semibold">{experience.role || 'Unknown Role'}</span>
          </p>
          {dateRange && (
            <p className="text-gray-600">{dateRange}</p>
          )}
          {experience.location && (
            <p className="text-gray-500 text-sm mt-1">📍 {experience.location}</p>
          )}
          {experience.date_confidence === 'low' && (
            <p className="text-amber-600 text-sm mt-3">
              ⚠️ We weren't confident about the dates - please verify
            </p>
          )}
        </div>
      </div>
      
      {experience.source_snippet && (
        <details className="text-left max-w-md mx-auto">
          <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-600">
            Show original text from CV
          </summary>
          <pre className="mt-2 p-3 bg-gray-100 rounded-lg text-xs text-gray-600 whitespace-pre-wrap font-mono">
            {experience.source_snippet}
          </pre>
        </details>
      )}
    </div>
  );
}

function EducationStep({ education, index, total, isEditing, editValue, setEditValue }: {
  education: Education;
  index: number;
  total: number;
  isEditing: boolean;
  editValue: any;
  setEditValue: (v: any) => void;
}) {
  if (isEditing) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Edit education</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
            <input
              type="text"
              value={editValue?.institution || ''}
              onChange={(e) => setEditValue({ ...editValue, institution: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
            <input
              type="text"
              value={editValue?.degree || ''}
              onChange={(e) => setEditValue({ ...editValue, degree: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Field of Study</label>
            <input
              type="text"
              value={editValue?.field || ''}
              onChange={(e) => setEditValue({ ...editValue, field: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Year</label>
              <input
                type="text"
                value={editValue?.start_date || ''}
                onChange={(e) => setEditValue({ ...editValue, start_date: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Year</label>
              <input
                type="text"
                value={editValue?.end_date || ''}
                onChange={(e) => setEditValue({ ...editValue, end_date: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
        <span className="text-2xl">🎓</span>
      </div>
      <div className="text-sm text-gray-500">
        Education {index + 1} of {total}
      </div>
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Is this education entry correct?
        </h3>
        <div className="bg-gray-50 rounded-xl p-6 text-left max-w-md mx-auto">
          <p className="text-2xl font-bold text-amber-600 mb-1">
            {education.institution || 'Unknown Institution'}
          </p>
          {education.degree && (
            <p className="text-lg text-gray-700">
              {education.degree}
              {education.field && ` in ${education.field}`}
            </p>
          )}
          {(education.start_date || education.end_date) && (
            <p className="text-gray-600 mt-2">
              {education.start_date} {education.start_date && education.end_date && '–'} {education.end_date}
            </p>
          )}
        </div>
      </div>
      
      {education.source_snippet && (
        <details className="text-left max-w-md mx-auto">
          <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-600">
            Show original text from CV
          </summary>
          <pre className="mt-2 p-3 bg-gray-100 rounded-lg text-xs text-gray-600 whitespace-pre-wrap font-mono">
            {education.source_snippet}
          </pre>
        </details>
      )}
    </div>
  );
}

function SkillsStep({ skills, isEditing, editValue, setEditValue }: {
  skills: string[];
  isEditing: boolean;
  editValue: any;
  setEditValue: (v: any) => void;
}) {
  const [newSkill, setNewSkill] = useState('');
  
  if (isEditing) {
    const handleAddSkill = () => {
      if (newSkill.trim() && !editValue.includes(newSkill.trim())) {
        setEditValue([...editValue, newSkill.trim()]);
        setNewSkill('');
      }
    };
    
    const handleRemoveSkill = (index: number) => {
      setEditValue(editValue.filter((_: any, i: number) => i !== index));
    };
    
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Edit your skills</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Add a skill..."
          />
          <button
            onClick={handleAddSkill}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {editValue?.map((skill: string, idx: number) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full"
            >
              {skill}
              <button
                onClick={() => handleRemoveSkill(idx)}
                className="ml-1 text-blue-400 hover:text-blue-600"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto">
        <span className="text-2xl">🛠️</span>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          We found these skills in your CV:
        </h3>
        <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
          {skills.map((skill, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
      <p className="text-gray-500">Are these skills correct?</p>
    </div>
  );
}

function LanguagesStep({ languages, isEditing, editValue, setEditValue }: {
  languages: string[];
  isEditing: boolean;
  editValue: any;
  setEditValue: (v: any) => void;
}) {
  const [newLanguage, setNewLanguage] = useState('');
  
  if (isEditing) {
    const handleAddLanguage = () => {
      if (newLanguage.trim() && !editValue.includes(newLanguage.trim())) {
        setEditValue([...editValue, newLanguage.trim()]);
        setNewLanguage('');
      }
    };
    
    const handleRemoveLanguage = (index: number) => {
      setEditValue(editValue.filter((_: any, i: number) => i !== index));
    };
    
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900">Edit languages you speak</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newLanguage}
            onChange={(e) => setNewLanguage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddLanguage()}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Add a language..."
          />
          <button
            onClick={handleAddLanguage}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {editValue?.map((lang: string, idx: number) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full"
            >
              {lang}
              <button
                onClick={() => handleRemoveLanguage(idx)}
                className="ml-1 text-orange-400 hover:text-orange-600"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
        <span className="text-2xl">🌍</span>
      </div>
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          We see that you speak the following languages:
        </h3>
        <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
          {languages.map((lang, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-4 py-2 bg-orange-50 text-orange-700 rounded-full font-medium text-lg"
            >
              {lang}
            </span>
          ))}
        </div>
      </div>
      <p className="text-gray-500">Is this correct?</p>
    </div>
  );
}
