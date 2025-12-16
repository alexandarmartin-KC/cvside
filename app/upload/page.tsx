'use client';

import { useState, useRef } from 'react';

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
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
  } | null>(null);

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
          <a 
            href="/" 
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:underline"
          >
            ← Back
          </a>
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
                <p className="text-sm text-gray-500">
                  Maximum file size: 4MB
                </p>
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
                    onClick={handleRemoveFile}
                    className="ml-4 text-sm font-medium text-red-600 hover:text-red-800 focus:outline-none focus:underline"
                  >
                    Remove
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
                focus:outline-none focus:ring-4 focus:ring-blue-300
                ${loading || !file || !!result
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
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
                  <span className={`text-xs text-center ${currentStep >= 4 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                    Matching jobs
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

            {/* Section 2: Top Matches */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Top Job Matches
                </h2>
              </div>
              <div className="divide-y divide-gray-200">
                {result.matches
                  .sort((a, b) => b.score - a.score)
                  .map((match, index) => {
                    const job = result.jobs.find(j => j.id === match.jobId);
                    if (!job) return null;
                    
                    const getScoreBadgeColor = (score: number) => {
                      if (score >= 80) return 'bg-green-100 text-green-700 border-green-200';
                      if (score >= 60) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
                      return 'bg-gray-100 text-gray-700 border-gray-200';
                    };

                    return (
                      <div key={match.jobId} className="p-6 hover:bg-gray-50 transition-colors">
                        {/* Job Header */}
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-600 text-sm font-semibold flex-shrink-0">
                                {index + 1}
                              </span>
                              <h3 className="text-lg font-semibold text-gray-900 truncate">
                                {job.title}
                              </h3>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 ml-10">
                              <span className="font-medium">{job.company}</span>
                              <span className="text-gray-400">•</span>
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {job.location}
                              </span>
                            </div>
                          </div>
                          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border flex-shrink-0 ${getScoreBadgeColor(match.score)}`}>
                            {match.score}% match
                          </div>
                        </div>

                        {/* Required Skills */}
                        <div className="ml-10 mb-3">
                          <div className="flex flex-wrap gap-2">
                            {job.skills.map((skill, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Match Reasons */}
                        <div className="ml-10 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm font-medium text-gray-900 mb-2">Why this matches:</p>
                          <ul className="space-y-1">
                            {match.reasons.map((reason, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start">
                                <span className="text-green-500 mr-2">•</span>
                                <span>{reason}</span>
                              </li>
                            ))}
                          </ul>
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
