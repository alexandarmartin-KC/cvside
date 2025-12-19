'use client';

import { useState, useRef, useEffect } from 'react';

export default function UploadPage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [profileSaved, setProfileSaved] = useState(false);
  const [expandedJobIds, setExpandedJobIds] = useState<Set<number>>(new Set());
  const [savedJobIds, setSavedJobIds] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<{
    cvProfile: {
      name: string;
      title: string;
      seniority_level: string;
      core_skills: string[];
      locations: string[];
      summary: string;
    };
    matches: Array<{
      jobId: number;
      score: number;
      reasons: string[];
    }>;
    jobs: Array<{
      id: number;
      title: string;
      company: string;
      location: string;
      skills: string[];
      description: string;
    }>;
    cvDataUrl?: string;
    fileName?: string;
    extractedText?: string;
  } | null>(null);

  // Draft state (user is editing)
  const [manualSkills, setManualSkills] = useState<string[]>([]);
  const [manualLocations, setManualLocations] = useState<string[]>([]);
  const [preferredLocation, setPreferredLocation] = useState<string>('');

  // Applied state (used for scoring)
  const [appliedSkills, setAppliedSkills] = useState<string[]>([]);
  const [appliedLocations, setAppliedLocations] = useState<string[]>([]);
  const [appliedPreferred, setAppliedPreferred] = useState<string>('');

  // Original state (from CV)
  const [originalSkills, setOriginalSkills] = useState<string[]>([]);
  const [originalLocations, setOriginalLocations] = useState<string[]>([]);
  const [originalPreferred, setOriginalPreferred] = useState<string>('');

  // UI state
  const [skillInput, setSkillInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [uiNote, setUiNote] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  // Helper to compare arrays case-insensitive as sets
  const arraysEqualIgnoreCase = (arr1: string[], arr2: string[]): boolean => {
    if (arr1.length !== arr2.length) return false;
    const set1 = new Set(arr1.map(s => s.toLowerCase()));
    const set2 = new Set(arr2.map(s => s.toLowerCase()));
    if (set1.size !== set2.size) return false;
    for (const item of set1) {
      if (!set2.has(item)) return false;
    }
    return true;
  };

  // Check if user is logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check-session');
        const wasLoggedIn = isLoggedIn;
        const nowLoggedIn = response.ok;
        setIsLoggedIn(nowLoggedIn);
        
        // If user just logged in, check for pending CV data in localStorage
        if (!wasLoggedIn && nowLoggedIn) {
          console.log('User just logged in - checking for pending CV data');
          const pendingData = localStorage.getItem('pendingCvData');
          
          if (pendingData) {
            try {
              const parsed = JSON.parse(pendingData);
              console.log('Found pending CV data, saving to profile...');
              
              // Save the pending CV data
              const saveResponse = await fetch('/api/cv/save-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: parsed.cvProfile.name,
                  title: parsed.cvProfile.title,
                  seniority: parsed.cvProfile.seniority_level,
                  summary: parsed.cvProfile.summary,
                  skills: parsed.cvProfile.core_skills,
                  locations: parsed.cvProfile.locations,
                  preferredLocation: parsed.cvProfile.locations[0] || '',
                  cvFileName: parsed.fileName || 'CV.pdf',
                }),
              });
              
              if (saveResponse.ok) {
                console.log('Pending CV profile saved successfully');
                localStorage.removeItem('pendingCvData');
                setProfileSaved(true);
              }
            } catch (error) {
              console.error('Failed to save pending CV data:', error);
            }
          }
          
          // Also check if there's current result data
          if (result && !profileSaved) {
            console.log('User just logged in with existing CV data - auto-saving profile');
            await saveCvProfile(result);
          }
        }
      } catch {
        setIsLoggedIn(false);
      }
    };
    checkAuth();
    
    // Re-check auth every 5 seconds in case user signs in from another tab
    const interval = setInterval(checkAuth, 5000);
    return () => clearInterval(interval);
  }, [result, profileSaved]);

  // Initialize when result changes
  useEffect(() => {
    if (result?.cvProfile) {
      const skills = result.cvProfile.core_skills || [];
      const locations = result.cvProfile.locations || [];
      const preferred = locations.length > 0 ? locations[0] : '';
      
      // Set all three states
      setManualSkills(skills);
      setManualLocations(locations);
      setPreferredLocation(preferred);
      
      setAppliedSkills(skills);
      setAppliedLocations(locations);
      setAppliedPreferred(preferred);
      
      setOriginalSkills(skills);
      setOriginalLocations(locations);
      setOriginalPreferred(preferred);

      setIsDirty(false);
      setUpdatedAt(null);

      // Load saved jobs if user is authenticated
      if (isLoggedIn) {
        loadSavedJobs();
      }
    }
  }, [result, isLoggedIn]);

  // Load saved jobs from database
  const loadSavedJobs = async () => {
    try {
      const response = await fetch('/api/upload/jobs/saved');
      if (response.ok) {
        const data = await response.json();
        // Extract job IDs from mock job IDs (mock-1 -> 1)
        const jobIds = data.savedJobIds
          .map((id: string) => {
            const match = id.match(/^mock-(\d+)$/);
            return match ? parseInt(match[1]) : null;
          })
          .filter((id: number | null): id is number => id !== null);
        setSavedJobIds(new Set(jobIds));
      }
    } catch (error) {
      console.error('Failed to load saved jobs:', error);
    }
  };

  // Check if draft differs from applied
  useEffect(() => {
    const skillsDifferent = !arraysEqualIgnoreCase(manualSkills, appliedSkills);
    const locationsDifferent = !arraysEqualIgnoreCase(manualLocations, appliedLocations);
    const preferredDifferent = preferredLocation.toLowerCase() !== appliedPreferred.toLowerCase();
    
    setIsDirty(skillsDifferent || locationsDifferent || preferredDifferent);
  }, [manualSkills, manualLocations, preferredLocation, appliedSkills, appliedLocations, appliedPreferred]);

  // Ensure preferredLocation stays valid
  useEffect(() => {
    if (manualLocations.length === 0) {
      setPreferredLocation('');
    } else if (!manualLocations.includes(preferredLocation)) {
      setPreferredLocation(manualLocations[0]);
    }
  }, [manualLocations, preferredLocation]);

  // Add skill handler
  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    
    const exists = manualSkills.some(s => s.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setUiNote('Already added');
      setTimeout(() => setUiNote(''), 2000);
      return;
    }
    
    setManualSkills([...manualSkills, trimmed]);
    setSkillInput('');
  };

  const handleRemoveSkill = (skill: string) => {
    setManualSkills(manualSkills.filter(s => s !== skill));
  };

  const handleClearSkills = () => {
    setManualSkills([]);
  };

  // Add location handler
  const handleAddLocation = () => {
    const trimmed = locationInput.trim();
    if (!trimmed) return;
    
    const exists = manualLocations.some(l => l.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setUiNote('Already added');
      setTimeout(() => setUiNote(''), 2000);
      return;
    }
    
    setManualLocations([...manualLocations, trimmed]);
    setLocationInput('');
  };

  const handleRemoveLocation = (location: string) => {
    setManualLocations(manualLocations.filter(l => l !== location));
  };

  const handleResetToCV = () => {
    setManualSkills(originalSkills);
    setManualLocations(originalLocations);
    setPreferredLocation(originalPreferred);
  };

  // Update matches - apply draft to applied state
  const handleUpdateMatches = async () => {
    setIsUpdating(true);
    
    // Simulate a brief processing delay for UX
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // Apply draft to applied state
    setAppliedSkills(manualSkills);
    setAppliedLocations(manualLocations);
    setAppliedPreferred(preferredLocation);
    
    setUpdatedAt(new Date());
    setIsUpdating(false);

    // Save to database if logged in
    if (isLoggedIn) {
      await saveCvProfile();
    }
  };

  // Save CV profile to database
  const saveCvProfile = async (cvData?: typeof result) => {
    const dataToSave = cvData || result;
    if (!isLoggedIn || !dataToSave) return;

    try {
      console.log('Saving CV profile...');
      const response = await fetch('/api/cv/save-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: dataToSave.cvProfile.name,
          title: dataToSave.cvProfile.title,
          seniority: dataToSave.cvProfile.seniority_level,
          summary: dataToSave.cvProfile.summary,
          skills: cvData ? dataToSave.cvProfile.core_skills : manualSkills,
          locations: cvData ? dataToSave.cvProfile.locations : manualLocations,
          preferredLocation: cvData ? (dataToSave.cvProfile.locations[0] || '') : preferredLocation,
          workPreference: 'ANY',
          cvFileName: file?.name || 'CV.pdf',
          cvUrl: dataToSave.cvDataUrl || null,
          rawCvText: dataToSave.extractedText || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('CV profile save response:', data);
        if (data.saved) {
          setProfileSaved(true);
          console.log('CV profile saved successfully');
        }
      } else {
        console.error('Failed to save CV profile - response not ok');
      }
    } catch (error) {
      console.error('Failed to save CV profile:', error);
    }
  };

  // Calculate adjusted scores using APPLIED state
  const getAdjustedMatches = () => {
    if (!result) return [];

    return result.matches.map(match => {
      const job = result.jobs.find(j => j.id === match.jobId);
      if (!job) return { ...match, adjustedScore: match.score };

      const apiScore = match.score;
      
      // Use APPLIED state for scoring
      const jobSkills = (job.skills || []).map(s => s.toLowerCase());
      const userSkills = appliedSkills.map(s => s.toLowerCase());
      const skillOverlapCount = jobSkills.filter(s => userSkills.includes(s)).length;

      // Location boost
      let locationBoost = 0;
      const jobLoc = job.location.toLowerCase();
      const preferredLoc = appliedPreferred.toLowerCase();
      const userLocs = appliedLocations.map(l => l.toLowerCase());

      if (preferredLoc && jobLoc === preferredLoc) {
        locationBoost = 10;
      } else if (userLocs.includes(jobLoc)) {
        locationBoost = 5;
      }

      const adjustedScore = Math.min(100, Math.max(0, apiScore + skillOverlapCount * 2 + locationBoost));

      return {
        ...match,
        adjustedScore,
        skillOverlapCount,
        locationBoost
      };
    }).sort((a, b) => b.adjustedScore - a.adjustedScore);
  };

  const hasAppliedChanges = () => {
    if (!result) return false;
    
    const skillsChanged = !arraysEqualIgnoreCase(appliedSkills, originalSkills);
    const locationsChanged = !arraysEqualIgnoreCase(appliedLocations, originalLocations);
    const preferredChanged = appliedPreferred.toLowerCase() !== originalPreferred.toLowerCase();
    
    return skillsChanged || locationsChanged || preferredChanged;
  };

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffSeconds < 10) return 'Updated just now';
    if (diffSeconds < 60) return `Updated ${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `Updated ${Math.floor(diffSeconds / 60)}m ago`;
    return `Updated at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const validateFile = (selectedFile: File): boolean => {
    if (selectedFile.type !== 'application/pdf') {
      setError('Please select a valid PDF file');
      return false;
    }

    const maxSize = 4 * 1024 * 1024; // 4MB in bytes
    if (selectedFile.size > maxSize) {
      setError('PDF file is too large. Please upload a file smaller than 4MB.');
      return false;
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (validateFile(selectedFile)) {
      setFile(selectedFile);
      setError('');
      setCurrentStep(1); // Step 1: CV uploaded
    } else {
      setFile(null);
      setCurrentStep(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && validateFile(droppedFile)) {
      setFile(droppedFile);
      setError('');
      setCurrentStep(1); // Step 1: CV uploaded
    } else if (droppedFile) {
      setFile(null);
      setCurrentStep(0);
    }
  };

  const handleDropzoneClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError('');
    setCurrentStep(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Toggle job card expanded state (read more/less)
  const toggleJobExpanded = (jobId: number) => {
    setExpandedJobIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  // Toggle job saved state (with auth check)
  const toggleJobSaved = async (jobId: number) => {
    // Check if user is logged in
    const userLoggedIn = isLoggedIn === true;
    
    if (!isLoggedIn) {
      // Show message and redirect to login
      if (confirm('Create an account to save jobs and track applications.\n\nGo to login page?')) {
        window.location.href = '/login';
      }
      return;
    }

    const wasSaved = savedJobIds.has(jobId);

    // Optimistic update
    setSavedJobIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });

    try {
      // Get job details from result
      const job = result?.jobs.find(j => j.id === jobId);
      const match = result?.matches.find(m => m.jobId === jobId);
      
      if (!job) throw new Error('Job not found');

      // Call API to save/unsave job
      const endpoint = wasSaved 
        ? '/api/upload/jobs/unsave'
        : '/api/upload/jobs/save';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          job: {
            id: job.id,
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.description,
            skills: job.skills,
          },
          match: match ? {
            score: match.score,
            reasons: match.reasons,
          } : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save job');
      }
    } catch (error) {
      // Rollback on error
      setSavedJobIds(prev => {
        const newSet = new Set(prev);
        if (wasSaved) {
          newSet.add(jobId);
        } else {
          newSet.delete(jobId);
        }
        return newSet;
      });
      console.error('Failed to save job:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save job';
      alert(`Failed to save job: ${errorMessage}\n\nCheck console for details.`);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    setLoading(true);
    setStatus('Uploading...');
    setError('');
    setResult(null);
    setCurrentStep(2); // Step 2: Reading content

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate progress through steps
      setTimeout(() => setCurrentStep(3), 800); // Step 3: Analyzing skills

      const response = await fetch('/api/cv/parse', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      setCurrentStep(4); // Step 4: Matching jobs
      setResult(data);
      setStatus('Upload successful!');

      // Store CV data in localStorage for persistence across navigation
      if (data.cvProfile) {
        localStorage.setItem('pendingCvData', JSON.stringify({
          cvProfile: data.cvProfile,
          fileName: file.name,
          cvDataUrl: data.cvDataUrl,
          timestamp: Date.now()
        }));
      }

      // Auto-save to database if logged in - pass data directly
      if (isLoggedIn && data.cvProfile) {
        console.log('User logged in, saving CV profile...');
        await saveCvProfile(data);
        // Clear localStorage after successful save
        localStorage.removeItem('pendingCvData');
      } else {
        console.log('Not saving CV profile yet - user not logged in');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStatus('');
      setCurrentStep(1); // Reset to step 1 on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="text-lg font-semibold text-gray-900">
            CV Matcher
          </div>
          <div className="flex items-center gap-4">
            {isLoggedIn && (
              <a
                href="/dashboard"
                className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                Go to Dashboard →
              </a>
            )}
            <a 
              href="/" 
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:underline"
            >
              ← Back
            </a>
          </div>
        </div>
      </header>

      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Upload your CV
          </h1>
          <p className="text-lg text-gray-600">
            Get AI-powered analysis and personalized job matches in seconds
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* File Dropzone */}
          <div className="mb-6">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            
            {!file ? (
              <div
                onClick={handleDropzoneClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleDropzoneClick();
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label="Upload PDF file"
                className={`
                  relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
                  transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300
                  ${isDragging 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                  }
                `}
              >
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-4"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Drop your PDF here, or click to browse
                </p>
                <p className="text-sm text-gray-500 mb-1">
                  PDF files only
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Maximum file size: 4MB
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-700 bg-blue-50 px-4 py-3 rounded-lg border border-blue-200">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="font-medium">Your data is private and secure. We don't store your CV.</span>
                </div>
              </div>
            ) : (
              <div className="border-2 border-green-300 bg-green-50 rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-10 w-10 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleDropzoneClick}
                    className="ml-4 text-sm font-medium text-blue-600 hover:text-blue-800 focus:outline-none focus:underline"
                  >
                    Upload new
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Upload Button */}
          <div className="flex justify-center">
            <button
              onClick={handleUpload}
              disabled={loading || !file || !!result}
              className={`
                w-full sm:w-auto sm:min-w-[240px]
                py-3.5 px-8 
                text-base font-semibold text-white
                rounded-lg 
                transition-all duration-200 
                focus:outline-none focus:ring-4
                ${result
                  ? 'bg-green-600 cursor-default shadow-lg focus:ring-green-300'
                  : loading || !file
                  ? 'bg-gray-300 cursor-not-allowed focus:ring-blue-300' 
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 focus:ring-blue-300'
                }
              `}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg 
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Uploading…
                </span>
              ) : result ? (
                <span className="flex items-center justify-center">
                  <svg 
                    className="mr-2 h-5 w-5 text-white" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M5 13l4 4L19 7" 
                    />
                  </svg>
                  Done
                </span>
              ) : (
                'Upload & Analyze'
              )}
            </button>
          </div>

          {/* Progress Steps */}
          {currentStep > 0 && (
            <div className="mt-8 mb-6">
              <div className="flex items-center justify-between max-w-2xl mx-auto">
                {/* Step 1: CV Uploaded */}
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                    currentStep >= 1 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {currentStep >= 1 ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-sm font-medium">1</span>
                    )}
                  </div>
                  <span className={`text-xs text-center ${currentStep >= 1 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                    CV uploaded
                  </span>
                </div>

                {/* Connector Line */}
                <div className={`h-0.5 flex-1 mx-2 transition-colors ${currentStep >= 2 ? 'bg-green-300' : 'bg-gray-200'}`} />

                {/* Step 2: Reading Content */}
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                    currentStep > 2 ? 'bg-green-100 text-green-600' : currentStep === 2 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {currentStep > 2 ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : currentStep === 2 ? (
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <span className="text-sm font-medium">2</span>
                    )}
                  </div>
                  <span className={`text-xs text-center ${currentStep >= 2 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                    Reading content
                  </span>
                </div>

                {/* Connector Line */}
                <div className={`h-0.5 flex-1 mx-2 transition-colors ${currentStep >= 3 ? 'bg-green-300' : 'bg-gray-200'}`} />

                {/* Step 3: Analyzing Skills */}
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                    currentStep > 3 ? 'bg-green-100 text-green-600' : currentStep === 3 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {currentStep > 3 ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : currentStep === 3 ? (
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <span className="text-sm font-medium">3</span>
                    )}
                  </div>
                  <span className={`text-xs text-center ${currentStep >= 3 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                    Analyzing skills
                  </span>
                </div>

                {/* Connector Line */}
                <div className={`h-0.5 flex-1 mx-2 transition-colors ${currentStep >= 4 ? 'bg-green-300' : 'bg-gray-200'}`} />

                {/* Step 4: Matching Jobs */}
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${
                    currentStep >= 4 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {currentStep >= 4 ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <span className="text-sm font-medium">4</span>
                    )}
                  </div>
                  <span className={`text-xs text-center ${currentStep >= 4 ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
                    {currentStep >= 4 ? 'Done' : 'Matching jobs'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Status Area */}
          <div className="mt-6">
            {/* Progress Bar */}
            {loading && (
              <div className="mb-4">
                <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-progress"></div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
                <svg 
                  className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                <p className="text-sm text-red-800 leading-relaxed">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {status && !error && !loading && (
              <div className="p-4 bg-green-50 border border-green-100 rounded-lg flex items-start gap-3">
                <svg 
                  className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                <p className="text-sm text-green-800 leading-relaxed">{status}</p>
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="mt-12 space-y-8">
            {/* Logged-in user banner */}
            {isLoggedIn && profileSaved && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Profile Saved Successfully!
                    </h3>
                    <p className="text-gray-700 mb-4">
                      Your CV profile has been saved to your account. You can now track your job applications, save jobs, and get personalized matches in your dashboard.
                    </p>
                    <a
                      href="/dashboard"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                    >
                      <span>Open Dashboard</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Not logged in banner */}
            {!isLoggedIn && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Get a Complete Overview of Your Job Search
                    </h3>
                    <p className="text-gray-700 mb-4">
                      Sign in to save jobs, access your full dashboard, track applications, and improve your job search with CV and cover letter tools.
                    </p>
                    <a
                      href="/login"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                    >
                      <span>Create a profile or sign in</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* What We Understood From Your CV */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800">
                  What we understood from your CV
                </h2>
              </div>
              <div className="p-6 space-y-5">
                {/* Name */}
                {result.cvProfile.name && (
                  <div>
                    <h3 className="text-2xl font-semibold text-gray-900 tracking-tight">
                      {result.cvProfile.name}
                    </h3>
                  </div>
                )}
                
                {/* Title and Seniority */}
                <div className="flex flex-wrap items-center gap-2 text-base">
                  <span className="font-medium text-gray-900">{result.cvProfile.title}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-600">{result.cvProfile.seniority_level}</span>
                </div>

                {/* Summary Paragraph */}
                <div className="pt-2">
                  <p className="text-gray-700 leading-relaxed text-[15px]">
                    {result.cvProfile.summary}
                  </p>
                </div>

                {/* Skills Pills */}
                <div className="pt-5 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-600 mb-3 uppercase tracking-wide">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {result.cvProfile.core_skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-3 py-1.5 bg-gray-50 text-gray-700 text-sm font-medium rounded-md border border-gray-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Preferred Locations */}
                {result.cvProfile.locations && result.cvProfile.locations.length > 0 && (
                  <div className="pt-5 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-600 mb-3 uppercase tracking-wide">Preferred Locations</p>
                    <div className="flex flex-wrap gap-2">
                      {result.cvProfile.locations.map((location, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 text-sm rounded-md border border-gray-200"
                        >
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {location}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Manual Editing Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">
                    Refine your preferences
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Adjust your skills and locations to get better matches
                  </p>
                </div>
                {(isDirty || hasAppliedChanges()) && (
                  <button
                    onClick={handleResetToCV}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Reset to CV
                  </button>
                )}
              </div>
              <div className="p-6 space-y-6">
                {/* Skills Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Skills
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Add tools, languages, frameworks — press Enter to add
                  </p>
                  
                  {/* Skills Input */}
                  <div className="relative">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      placeholder="Add a skill (e.g. React) and press Enter"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                    />
                    {uiNote && (
                      <div className="absolute -bottom-6 left-0 text-xs text-amber-600">
                        {uiNote}
                      </div>
                    )}
                  </div>

                  {/* Skills Chips */}
                  {manualSkills.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {manualSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full border border-blue-200 transition-all hover:bg-blue-100"
                        >
                          {skill}
                          <button
                            onClick={() => handleRemoveSkill(skill)}
                            className="ml-0.5 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                            aria-label={`Remove ${skill}`}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Clear Button */}
                  {manualSkills.length > 0 && (
                    <button
                      onClick={handleClearSkills}
                      className="mt-3 text-xs text-gray-500 hover:text-gray-700 font-medium transition-colors"
                    >
                      Clear all skills
                    </button>
                  )}
                </div>

                {/* Locations Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Locations
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    Add multiple locations to widen your search
                  </p>
                  
                  {/* Location Input */}
                  <input
                    type="text"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddLocation();
                      }
                    }}
                    placeholder="Add a location (e.g. Copenhagen) and press Enter"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm"
                  />

                  {/* Location Chips */}
                  {manualLocations.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {manualLocations.map((location, idx) => {
                        const isPreferred = location === preferredLocation;
                        return (
                          <span
                            key={idx}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border transition-all ${
                              isPreferred
                                ? 'bg-green-50 text-green-700 border-green-300 ring-2 ring-green-100'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {location}
                            {isPreferred && (
                              <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded-full">
                                Preferred
                              </span>
                            )}
                            <button
                              onClick={() => handleRemoveLocation(location)}
                              className="ml-0.5 hover:bg-gray-200 rounded-full p-0.5 transition-colors"
                              aria-label={`Remove ${location}`}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Preferred Location Dropdown */}
                  {manualLocations.length > 0 && (
                    <div className="mt-4">
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        Preferred location
                      </label>
                      <select
                        value={preferredLocation}
                        onChange={(e) => setPreferredLocation(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm bg-white"
                      >
                        {manualLocations.map((location, idx) => (
                          <option key={idx} value={location}>
                            {location}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Update Matches Button */}
                <div className="pt-6 border-t border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">
                        Apply your added skills and locations to refresh results.
                      </p>
                      {updatedAt && !isDirty && (
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {formatTimestamp(updatedAt)}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleUpdateMatches}
                      disabled={!isDirty || isUpdating || !result}
                      className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 h-11 rounded-lg font-semibold transition-all text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        isDirty && !isUpdating
                          ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-md hover:shadow-lg'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {isUpdating ? (
                        <>
                          <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Updating…</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <span>Update matches</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Top Matches */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Top matches
              </h2>
              <div className="grid gap-5">
                {getAdjustedMatches().map((match) => {
                  const job = result.jobs.find(j => j.id === match.jobId);
                  if (!job) return null;
                  
                  const getScoreBadgeColor = (score: number) => {
                    if (score >= 80) return 'bg-green-50 text-green-700 border-green-200';
                    if (score >= 60) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
                    return 'bg-gray-50 text-gray-700 border-gray-200';
                  };

                  const isAdjusted = hasAppliedChanges();
                  const isExpanded = expandedJobIds.has(match.jobId);
                  const isSaved = savedJobIds.has(match.jobId);

                  return (
                    <div key={match.jobId} className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors">
                      {/* Job Header */}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {job.title}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span>{job.location}</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border flex-shrink-0 ${getScoreBadgeColor(match.adjustedScore)}`}>
                            {match.adjustedScore}
                          </div>
                          {isAdjusted && (
                            <span className="text-xs text-gray-500">
                              Adjusted by your preferences
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Match Reasons */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm font-medium text-gray-700 mb-3">Why it matches you</p>
                        <ul className="space-y-2">
                          {match.reasons.map((reason, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start">
                              <svg className="w-4 h-4 text-gray-400 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Expandable Job Details */}
                      <div 
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          isExpanded ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="pt-4 border-t border-gray-100 space-y-4">
                          {/* Job Description */}
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Job Description</p>
                            <div className="text-sm text-gray-600 leading-relaxed max-h-48 overflow-y-auto pr-2">
                              {job.description}
                            </div>
                          </div>

                          {/* Skills Required */}
                          {job.skills && job.skills.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-2">Skills Required</p>
                              <div className="flex flex-wrap gap-2">
                                {job.skills.map((skill, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Company & Location */}
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Details</p>
                            <div className="space-y-1 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <span>{job.company}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>{job.location}</span>
                              </div>
                            </div>
                          </div>

                          {/* CTA for non-logged in users */}
                          {!isLoggedIn && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-4">
                              <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div className="flex-1">
                                  <p className="text-sm text-gray-800 mb-2">
                                    <strong>Create a profile</strong> to save jobs, track applications, and get the full benefits of your job dashboard
                                  </p>
                                  <a
                                    href="/signup"
                                    className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                  >
                                    Sign up now
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                  </a>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => toggleJobExpanded(match.jobId)}
                          aria-expanded={isExpanded}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 focus:outline-none focus:underline transition-colors"
                        >
                          {isExpanded ? (
                            <span className="flex items-center gap-1">
                              <span>Show less</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <span>Read more</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </span>
                          )}
                        </button>
                        
                        {isLoggedIn && (
                          <button
                            onClick={() => toggleJobSaved(match.jobId)}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                              isSaved
                                ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 focus:ring-green-500'
                                : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100 focus:ring-gray-500'
                            }`}
                          >
                            {isSaved ? (
                              <>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                                <span>Saved ✓</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                                <span>Save job</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
