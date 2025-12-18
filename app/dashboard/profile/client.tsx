'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type CvProfile = {
  id: string;
  name: string | null;
  title: string | null;
  summary: string | null;
  workPreference: string | null;
  cvFileName: string | null;
  cvUploadedAt: Date | null;
  cvUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function ProfileForm({ profile }: { profile: CvProfile }) {
  const [name, setName] = useState(profile.name || '');
  const [title, setTitle] = useState(profile.title || '');
  const [summary, setSummary] = useState(profile.summary || '');
  const [workPreference, setWorkPreference] = useState(profile.workPreference || 'ANY');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadStep, setUploadStep] = useState(0);
  const [showProgress, setShowProgress] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Fade out progress indicator after completion
  useEffect(() => {
    if (uploadStep === 4) {
      const timer = setTimeout(() => {
        setShowProgress(false);
        // Reset after fade animation completes
        setTimeout(() => {
          setUploadStep(0);
          setShowProgress(true);
        }, 500); // Duration of fade animation
      }, 1000); // Wait 1 second before fading
      
      return () => clearTimeout(timer);
    }
  }, [uploadStep]);

  async function handleSave() {
    setLoading(true);
    setSaved(false);
    try {
      const res = await fetch('/api/dashboard/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          title,
          summary,
          workPreference,
        }),
      });
      if (res.ok) {
        setSaved(true);
        router.refresh();
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert('Failed to save changes');
      }
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'Unknown';
    return new Intl.DateTimeFormat('da-DK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(date));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setUploadError('Please select a PDF file');
      return;
    }

    setUploading(true);
    setUploadError('');
    setUploadStep(1); // Step 1: Uploading

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate progress through steps
      setTimeout(() => setUploadStep(2), 500); // Step 2: Analyzing

      // Parse the CV
      const parseResponse = await fetch('/api/cv/parse', {
        method: 'POST',
        body: formData,
      });

      if (!parseResponse.ok) {
        const errorData = await parseResponse.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const parseData = await parseResponse.json();
      setUploadStep(3); // Step 3: Updating profile

      // Save the CV profile
      const saveResponse = await fetch('/api/cv/save-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: parseData.cvProfile.name,
          title: parseData.cvProfile.title,
          seniority: parseData.cvProfile.seniority_level,
          summary: parseData.cvProfile.summary,
          skills: parseData.cvProfile.core_skills,
          locations: parseData.cvProfile.locations,
          preferredLocation: parseData.cvProfile.locations[0] || '',
          workPreference: workPreference || 'ANY',
          cvFileName: file.name,
          cvUrl: parseData.cvDataUrl || null,
        }),
      });

      if (saveResponse.ok) {
        setUploadStep(4); // Step 4: Done
        // Update local state with new values
        setName(parseData.cvProfile.name);
        setTitle(parseData.cvProfile.title);
        setSummary(parseData.cvProfile.summary);
        
        // Wait for progress indicator to show and fade
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Soft refresh - reload the page without losing session
        window.location.reload();
      } else {
        throw new Error('Failed to save CV profile');
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'An error occurred');
      setUploadStep(0);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleReplaceClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-6">
      {/* Card 1: Standard Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Standard Information</h2>
        <p className="text-sm text-gray-500 mb-2">
          These details are used as your base profile for job matching.
        </p>
        <p className="text-sm text-blue-600 mb-6">
          These fields were extracted from your CV. You can edit them if needed.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Role/Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Frontend Developer"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Summary <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief professional summary..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          )}
        </div>
      </div>

      {/* Card 2: Base CV */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Base CV</h2>
        <p className="text-sm text-gray-500 mb-6">
          This CV is used as your base for job matching.
        </p>

        {/* Upload Progress Steps */}
        {uploadStep > 0 && (
          <div 
            className={`mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200 transition-opacity duration-500 ${
              showProgress ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="flex items-center justify-between">
              {/* Step 1: Uploading */}
              <div className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                  uploadStep >= 1 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {uploadStep > 1 ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : uploadStep === 1 ? (
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">1</span>
                  )}
                </div>
                <span className={`text-xs text-center ${uploadStep >= 1 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                  Uploading
                </span>
              </div>

              {/* Connector Line */}
              <div className={`h-0.5 flex-1 mx-2 transition-colors ${uploadStep >= 2 ? 'bg-green-300' : 'bg-gray-200'}`} />

              {/* Step 2: Analyzing */}
              <div className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                  uploadStep > 2 ? 'bg-green-100 text-green-600' : uploadStep === 2 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {uploadStep > 2 ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : uploadStep === 2 ? (
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">2</span>
                  )}
                </div>
                <span className={`text-xs text-center ${uploadStep >= 2 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                  Analyzing
                </span>
              </div>

              {/* Connector Line */}
              <div className={`h-0.5 flex-1 mx-2 transition-colors ${uploadStep >= 3 ? 'bg-green-300' : 'bg-gray-200'}`} />

              {/* Step 3: Updating */}
              <div className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                  uploadStep > 3 ? 'bg-green-100 text-green-600' : uploadStep === 3 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {uploadStep > 3 ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : uploadStep === 3 ? (
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">3</span>
                  )}
                </div>
                <span className={`text-xs text-center ${uploadStep >= 3 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                  Updating
                </span>
              </div>

              {/* Connector Line */}
              <div className={`h-0.5 flex-1 mx-2 transition-colors ${uploadStep >= 4 ? 'bg-green-300' : 'bg-gray-200'}`} />

              {/* Step 4: Done */}
              <div className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                  uploadStep >= 4 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {uploadStep >= 4 ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">4</span>
                  )}
                </div>
                <span className={`text-xs text-center ${uploadStep >= 4 ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
                  {uploadStep >= 4 ? 'Done!' : 'Done'}
                </span>
              </div>
            </div>
          </div>
        )}

        {profile.cvFileName ? (
          <>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <svg className="w-10 h-10 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{profile.cvFileName}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Uploaded {formatDate(profile.cvUploadedAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {profile.cvUrl ? (
                <button
                  onClick={() => {
                    const win = window.open('', '_blank');
                    if (win) {
                      win.document.write(`
                        <html>
                          <head><title>${profile.cvFileName || 'CV'}</title></head>
                          <body style="margin:0;">
                            <iframe src="${profile.cvUrl}" style="border:none;width:100%;height:100vh;"></iframe>
                          </body>
                        </html>
                      `);
                      win.document.close();
                    }
                  }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open CV (PDF)
                </button>
              ) : (
                <button
                  onClick={() => alert('CV file not available. Please re-upload your CV to enable viewing.')}
                  className="inline-flex items-center px-4 py-2 bg-gray-400 text-white font-medium rounded-lg cursor-not-allowed opacity-60"
                  disabled
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open CV (PDF)
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={handleReplaceClick}
                disabled={uploading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {uploading ? 'Uploading...' : 'Replace CV'}
              </button>
            </div>
            {uploadError && (
              <p className="mt-3 text-sm text-red-600">{uploadError}</p>
            )}
          </>
        ) : (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 mb-6">
            <p className="text-gray-600 mb-4">No CV available. Upload one to get started with job matching.</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={handleReplaceClick}
              disabled={uploading}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {uploading ? 'Uploading...' : 'Upload CV'}
            </button>
            {uploadError && (
              <p className="mt-3 text-sm text-red-600">{uploadError}</p>
            )}
          </div>
        )}
      </div>

      {/* Card 3: Work Preference */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Work Preference</h2>
        <p className="text-sm text-gray-500 mb-6">
          Choose what types of roles you want to see.
        </p>

        <div className="space-y-3">
          <label className="flex items-start gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
            <input
              type="radio"
              name="workPreference"
              value="ANY"
              checked={workPreference === 'ANY'}
              onChange={(e) => setWorkPreference(e.target.value)}
              className="mt-1 w-4 h-4 text-blue-600"
            />
            <div>
              <div className="font-medium text-gray-900">Open to all</div>
              <div className="text-sm text-gray-500">Show me all types of roles</div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
            <input
              type="radio"
              name="workPreference"
              value="REMOTE"
              checked={workPreference === 'REMOTE'}
              onChange={(e) => setWorkPreference(e.target.value)}
              className="mt-1 w-4 h-4 text-blue-600"
            />
            <div>
              <div className="font-medium text-gray-900">Remote only</div>
              <div className="text-sm text-gray-500">Only show fully remote positions</div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
            <input
              type="radio"
              name="workPreference"
              value="HYBRID"
              checked={workPreference === 'HYBRID'}
              onChange={(e) => setWorkPreference(e.target.value)}
              className="mt-1 w-4 h-4 text-blue-600"
            />
            <div>
              <div className="font-medium text-gray-900">Hybrid only</div>
              <div className="text-sm text-gray-500">Combination of office and remote work</div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
            <input
              type="radio"
              name="workPreference"
              value="ONSITE"
              checked={workPreference === 'ONSITE'}
              onChange={(e) => setWorkPreference(e.target.value)}
              className="mt-1 w-4 h-4 text-blue-600"
            />
            <div>
              <div className="font-medium text-gray-900">On-site only</div>
              <div className="text-sm text-gray-500">Full-time office-based roles</div>
            </div>
          </label>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          This preference is saved when you click "Save Changes" above.
        </p>
      </div>
    </div>
  );
}
