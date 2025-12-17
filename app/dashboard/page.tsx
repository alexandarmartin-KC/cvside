import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ProfileForm } from './profile-form';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    return <div>Not authenticated</div>;
  }
  
  const userId = session.user.id;
  const isTestUser = userId.startsWith('test-');

  // Show test mode banner for test users
  if (isTestUser) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200 p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome to Test Mode!</h1>
              <p className="text-gray-700 mt-1">
                Signed in as: <strong>{session.user.email || 'Test User'}</strong>
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Get Started:</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-700">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Upload your CV to test CV parsing</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Explore the dashboard interface</span>
              </div>
              <div className="flex items-center gap-2 text-amber-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Test data won't persist in database</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/upload"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload CV
            </Link>
            <Link
              href="/dashboard/matches"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all"
            >
              Browse Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // Real user with database
  try {
    const cvProfile = await prisma.cvProfile.findUnique({
      where: { userId },
    });

    // Get quick stats
    const [matchCount, savedCount, appliedCount] = await Promise.all([
      prisma.jobMatch.count({ where: { userId } }),
      prisma.savedJob.count({ where: { userId } }),
      prisma.appliedJob.count({ where: { userId } }),
    ]);

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Manage your profile and job search</p>
        </div>

        {/* Setup Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Setup Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatusItem
              complete={!!cvProfile}
              title="CV Uploaded"
              description={cvProfile ? `✓ ${cvProfile.cvFileName || 'CV on file'}` : 'Upload your CV to get started'}
            />
            <StatusItem
              complete={!!cvProfile && !!cvProfile.name && !!cvProfile.title}
              title="Profile Ready"
              description={cvProfile && cvProfile.name ? `✓ ${cvProfile.name}` : 'Complete your profile below'}
            />
            <StatusItem
              complete={!!cvProfile && !!cvProfile.workPreference}
              title="Work Preference Set"
              description={cvProfile?.workPreference ? `✓ ${formatWorkPref(cvProfile.workPreference)}` : 'Set your preferences'}
            />
          </div>
          
          {!cvProfile && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Your CV
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionCard
            href="/dashboard/matches"
            title="Job Matches"
            count={matchCount}
            icon="briefcase"
            color="blue"
          />
          <QuickActionCard
            href="/dashboard/saved"
            title="Saved Jobs"
            count={savedCount}
            icon="bookmark"
            color="purple"
          />
          <QuickActionCard
            href="/dashboard/applied"
            title="Applications"
            count={appliedCount}
            icon="list"
            color="green"
          />
        </div>

        {/* Profile Form */}
        {cvProfile ? (
          <ProfileForm profile={cvProfile} />
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
            <svg className="w-12 h-12 text-yellow-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Your CV</h3>
            <p className="text-gray-700 mb-4">
              Get started by uploading your CV to create your profile
            </p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upload CV
            </Link>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Dashboard error:', error);
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-900 mb-2">Database Connection Error</h2>
          <p className="text-red-700 mb-4">
            Unable to load dashboard data. This usually means the database isn't configured.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
          >
            Try Upload Page Instead
          </Link>
        </div>
      </div>
    );
  }
}

function StatusItem({ complete, title, description }: { complete: boolean; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${complete ? 'bg-green-100' : 'bg-gray-100'}`}>
        {complete ? (
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
      </div>
      <div>
        <div className="font-medium text-gray-900 text-sm">{title}</div>
        <div className="text-xs text-gray-600 mt-0.5">{description}</div>
      </div>
    </div>
  );
}

function QuickActionCard({ href, title, count, icon, color }: { href: string; title: string; count: number; icon: string; color: string }) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
  };

  const iconElements: Record<string, JSX.Element> = {
    briefcase: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    bookmark: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
    ),
    list: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  };

  return (
    <Link href={href} className="bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} text-white flex items-center justify-center`}>
          {iconElements[icon]}
        </div>
        <div className="text-3xl font-bold text-gray-900">{count}</div>
      </div>
      <div className="text-sm font-medium text-gray-700">{title}</div>
    </Link>
  );
}

function formatWorkPref(pref: string): string {
  const map: Record<string, string> = {
    'ANY': 'All types',
    'REMOTE_ONLY': 'Remote only',
    'NO_REMOTE': 'No remote',
  };

