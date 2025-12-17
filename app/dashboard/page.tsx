import { requireUser } from '@/lib/auth-session';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ProfileForm } from './profile-form';

export default async function DashboardPage() {
  const user = await requireUser();
  const userId = user.id;

  // Fetch CV profile
  let cvProfile = null;
  try {
    cvProfile = await prisma.cvProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
        title: true,
        cvFileName: true,
        cvUploadedAt: true,
      }
    });
  } catch (dbError) {
    console.error('Error fetching CV profile:', dbError);
    throw dbError;
  }

  // If no CV profile exists, show welcome message
  if (!cvProfile) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to CV Matcher!</h1>
          <p className="text-gray-600 mb-6">
            To get started, upload your CV and we'll analyze it to find matching job opportunities for you.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-800 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Your CV
          </Link>
        </div>
      </div>
    );
  }

  // Fetch job counts
  let matchCount = 0;
  let savedCount = 0;
  let appliedCount = 0;

  try {
    [matchCount, savedCount, appliedCount] = await Promise.all([
      prisma.jobMatch.count({ where: { userId } }),
      prisma.savedJob.count({ where: { userId } }),
      prisma.appliedJob.count({ where: { userId } }),
    ]);
  } catch (dbError) {
    console.error('Error fetching job counts:', dbError);
    matchCount = 0;
    savedCount = 0;
    appliedCount = 0;
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'Unknown';
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(new Date(date));
  };

  // DASHBOARD CONTENT - CV profile exists
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Your base profile</h1>
        <p className="text-gray-700 mt-1">
          Created from your uploaded CV and used for job matching.
        </p>
      </div>

      {/* Base CV Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Base CV</h2>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <svg className="w-10 h-10 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                {cvProfile.cvFileName || 'CV on file'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {cvProfile.cvUploadedAt 
                  ? `Uploaded ${formatDate(cvProfile.cvUploadedAt)}`
                  : 'Upload date unknown'}
              </p>
              {cvProfile.name && (
                <p className="text-sm text-gray-700 mt-2 font-medium">
                  {cvProfile.name}
                  {cvProfile.title && ` • ${cvProfile.title}`}
                </p>
              )}
            </div>
          </div>
        </div>

        <Link
          href="/upload"
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Replace CV
        </Link>
        <p className="text-xs text-gray-500 mt-2">
          Replacing your CV will update your base profile and job matches.
        </p>
      </div>

      {/* Primary Action: View Job Matches */}
      <Link
        href="/dashboard/matches"
        className="block bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg border border-blue-700 p-6 hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="text-xl font-bold text-white">View job matches</div>
              <div className="text-blue-100 mt-1">{matchCount} matching jobs found</div>
            </div>
          </div>
          <svg className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>

      {/* Secondary Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/dashboard/saved"
          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-gray-900">Saved jobs</div>
              <div className="text-sm text-gray-600">{savedCount} saved</div>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link
          href="/dashboard/applied"
          className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-green-300 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-gray-900">Applications</div>
              <div className="text-sm text-gray-600">{appliedCount} applied</div>
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Profile Form */}
      <ProfileForm profile={cvProfile} />
    </div>
  );
}
