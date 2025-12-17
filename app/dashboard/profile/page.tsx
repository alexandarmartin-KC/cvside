'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cvProfile, setCvProfile] = useState<any>(null);
  const [pendingSave, setPendingSave] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // Check for pending CV data in localStorage
        const pendingData = localStorage.getItem('pendingCvData');
        
        if (pendingData) {
          try {
            const parsed = JSON.parse(pendingData);
            console.log('Found pending CV data in localStorage, saving...');
            setPendingSave(true);
            
            // Save it to the database
            const response = await fetch('/api/cv/save-profile', {
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
            
            if (response.ok) {
              console.log('Pending CV saved successfully');
              localStorage.removeItem('pendingCvData');
            } else {
              console.error('Failed to save pending CV:', await response.text());
            }
          } catch (saveError) {
            console.error('Error saving pending CV:', saveError);
          } finally {
            setPendingSave(false);
          }
        }
        
        // Fetch the saved profile from database
        const profileResponse = await fetch('/api/dashboard/me/profile');
        if (profileResponse.ok) {
          const data = await profileResponse.json();
          console.log('Profile loaded:', data.profile);
          setCvProfile(data.profile);
        } else {
          console.error('Failed to fetch profile:', await profileResponse.text());
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, []);

  if (loading || pendingSave) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          </div>
          <p className="text-gray-600 mt-4">
            {pendingSave ? 'Saving your CV profile...' : 'Loading your profile...'}
          </p>
        </div>
      </div>
    );
  }

  if (!cvProfile) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No CV Profile Yet</h1>
          <p className="text-gray-600 mb-6">
            Upload your CV to get started with job matching
          </p>
          <a
            href="/upload"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Your CV
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile & CV</h1>
        
        {/* CV Info */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{cvProfile.name}</h2>
            <p className="text-lg text-gray-700">{cvProfile.title}</p>
            {cvProfile.seniority && (
              <p className="text-sm text-gray-600 mt-1">{cvProfile.seniority}</p>
            )}
          </div>

          {cvProfile.summary && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Summary</h3>
              <p className="text-gray-600">{cvProfile.summary}</p>
            </div>
          )}

          {cvProfile.skills && cvProfile.skills.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {cvProfile.skills.map((skill: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {cvProfile.locations && cvProfile.locations.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Locations</h3>
              <div className="flex flex-wrap gap-2">
                {cvProfile.locations.map((location: string, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {location}
                  </span>
                ))}
              </div>
            </div>
          )}

          {cvProfile.cvFileName && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                CV File: <span className="font-medium text-gray-900">{cvProfile.cvFileName}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
