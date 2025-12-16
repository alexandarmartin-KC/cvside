import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { JobCard } from '@/components/JobCard';
import Link from 'next/link';
import { SaveJobButton, MarkAppliedButton } from './actions';

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;
  const isTestUser = userId.startsWith('test-');

  // Show test mode banner for test users
  if (isTestUser) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200 p-8 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Welcome to Test Mode!</h1>
          <p className="text-lg text-gray-700 mb-6">
            You're signed in as: <strong>{session?.user?.email || 'Test User'}</strong>
          </p>
          
          <div className="bg-white rounded-lg p-6 mb-6 text-left">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">What you can do:</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">Upload Your CV</p>
                  <p className="text-sm text-gray-600">Test the CV parsing and job matching features</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">Browse the Interface</p>
                  <p className="text-sm text-gray-600">Explore all dashboard pages and features</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium text-gray-900">Limited Persistence</p>
                  <p className="text-sm text-gray-600">Test accounts don't save data to the database</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/upload"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload CV to Get Started
            </Link>
            <Link
              href="/dashboard/matches"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse Dashboard
            </Link>
          </div>

          <div className="mt-6 p-4 bg-blue-100 border border-blue-300 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>💡 Note:</strong> To save data permanently, set up a database and use Google OAuth or email authentication.
              See the <a href="https://github.com/alexandarmartin-KC/cvside" className="underline font-medium">GitHub repo</a> for setup instructions.
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Real user with database - original code
  try {
    // Get stats
    const [newJobsCount, appliedCount, cvProfile, recentMatches, followUpsDue] = await Promise.all([
      // New jobs: matches where user hasn't seen the job yet
      prisma.jobMatch.count({
        where: {
          userId,
          job: {
            seenJobs: {
              none: {
                userId,
              },
            },
          },
        },
      }),
      // Applied jobs in active statuses
      prisma.appliedJob.count({
        where: {
          userId,
          status: {
            in: ['APPLIED', 'INTERVIEW', 'OFFER'],
          },
        },
      }),
      // CV Profile
      prisma.cvProfile.findUnique({
        where: { userId },
      }),
      // Top 3 new job matches
      prisma.jobMatch.findMany({
        where: { userId },
        include: {
          job: true,
        },
        orderBy: {
          score: 'desc',
        },
        take: 3,
      }),
      // Follow-ups due: Applied > 10 days ago, status still APPLIED
    prisma.appliedJob.findMany({
      where: {
        userId,
        status: 'APPLIED',
        appliedAt: {
          lt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
      },
      include: {
        job: true,
      },
      orderBy: {
        appliedAt: 'asc',
      },
      take: 3,
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session!.user.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-600 mt-1">Here's your job search overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="New Jobs"
          value={newJobsCount}
          subtitle="New matches since last visit"
          icon="sparkles"
          color="blue"
          href="/dashboard/matches"
        />
        <StatCard
          title="Applied"
          value={appliedCount}
          subtitle="Active applications"
          icon="briefcase"
          color="green"
          href="/dashboard/applied"
        />
        <StatCard
          title="Follow-up Due"
          value={followUpsDue.length}
          subtitle="Applications needing follow-up"
          icon="clock"
          color="orange"
          href="/dashboard/applied"
        />
      </div>

      {/* CV Status */}
      {!cvProfile && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <svg className="w-6 h-6 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-900 mb-1">Upload your CV to get started</h3>
              <p className="text-yellow-800 text-sm mb-4">
                Upload your CV to get personalized job matches and save your preferences.
              </p>
              <Link
                href="/upload"
                className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Upload CV
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* New Job Matches */}
      {recentMatches.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Top Job Matches</h2>
            <Link
              href="/dashboard/matches"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View all →
            </Link>
          </div>
          <div className="grid gap-6">
            {recentMatches.map((match) => (
              <JobCard
                key={match.id}
                job={match.job}
                score={match.score}
                reasons={match.reasons}
                actions={
                  <>
                    <SaveJobButton jobId={match.job.id} userId={userId} />
                    <MarkAppliedButton jobId={match.job.id} userId={userId} />
                    <Link
                      href={`/dashboard/matches?job=${match.job.id}`}
                      className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      View Details
                    </Link>
                  </>
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Follow-ups */}
      {followUpsDue.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Follow-ups Due</h2>
          <div className="space-y-3">
            {followUpsDue.map((applied) => (
              <Link
                key={applied.id}
                href={`/dashboard/applied?job=${applied.job.id}`}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-orange-300 hover:shadow-md transition-all"
              >
                <div>
                  <h3 className="font-semibold text-gray-900">{applied.job.title}</h3>
                  <p className="text-sm text-gray-600">{applied.job.company}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Applied {applied.appliedAt ? new Date(applied.appliedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {recentMatches.length === 0 && cvProfile && (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No job matches yet</h3>
          <p className="text-gray-600 mb-6">Click "Refresh Jobs" to find matches based on your profile</p>
          <Link
            href="/dashboard/matches"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Job Matches
          </Link>
        </div>
      )}
    </div>
  );
  } catch (error) {
    console.error('Dashboard error:', error);
    return (
      <div className="p-6 max-w-4xl mx-auto">
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

function StatCard({
  title,
  value,
  subtitle,
  icon,
  color,
  href,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: string;
  color: string;
  href: string;
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
  };

  const iconElements: Record<string, JSX.Element> = {
    sparkles: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    briefcase: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    clock: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <Link href={href} className="block bg-white rounded-xl border border-gray-200 p-6 hover:border-blue-300 hover:shadow-lg transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-600 text-sm mb-1">{title}</p>
          <p className="text-4xl font-bold text-gray-900">{value}</p>
          <p className="text-gray-500 text-xs mt-2">{subtitle}</p>
        </div>
        <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} text-white flex items-center justify-center`}>
          {iconElements[icon]}
        </div>
      </div>
    </Link>
  );
}
