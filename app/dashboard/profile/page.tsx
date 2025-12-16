import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ProfileForm, RecomputeMatchesButton } from './client';

export default async function ProfilePage() {
  const session = await auth();
  const userId = session!.user.id;

  const cvProfile = await prisma.cvProfile.findUnique({
    where: { userId },
  });

  if (!cvProfile) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">CV & Preferences</h1>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <svg className="w-16 h-16 text-yellow-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No CV Profile Found</h2>
          <p className="text-gray-700 mb-6">
            Upload your CV to create your profile and get personalized job matches
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center px-6 py-3 bg-yellow-600 text-white font-semibold rounded-lg hover:bg-yellow-700 transition-colors"
          >
            Upload Your CV
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">CV & Preferences</h1>
          <p className="text-gray-600 mt-1">Manage your profile and preferences</p>
        </div>
        <RecomputeMatchesButton userId={userId} />
      </div>

      <ProfileForm profile={cvProfile} />
    </div>
  );
}
