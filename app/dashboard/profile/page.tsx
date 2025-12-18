import { requireUser } from '@/lib/auth-session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ProfileForm } from './client';
import { JobCard } from '@/components/JobCard';
import { SaveJobButton, MarkAppliedButton, RefreshJobsButton } from '../matches/client';
import { ProfileFilterForm } from './filter-form';

export const dynamic = 'force-dynamic';

type SearchParams = {
  location?: string;
  remote?: string;
  minScore?: string;
  sort?: string;
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const user = await requireUser();
  const userId = user.id;
  
  // Fetch user's CV profile
  const cvProfile = await prisma.cvProfile.findUnique({
    where: { userId: user.id },
  });

  // If no profile, redirect to upload
  if (!cvProfile) {
    redirect('/upload');
  }

  // Get search params for job filtering
  const params = await searchParams;
  const location = params.location || '';
  const remoteOnly = params.remote === 'true';
  const minScore = parseInt(params.minScore || '0');
  const sortBy = params.sort || 'score';

  // Build where clause for job matches
  const whereClause: any = {
    userId,
  };

  if (minScore > 0) {
    whereClause.score = { gte: minScore };
  }

  if (location || remoteOnly) {
    whereClause.job = {};
    if (location) {
      whereClause.job.location = { contains: location, mode: 'insensitive' };
    }
    if (remoteOnly) {
      whereClause.job.remote = true;
    }
  }

  // Fetch job matches
  const matches = await prisma.jobMatch.findMany({
    where: whereClause,
    include: {
      job: {
        include: {
          seenJobs: {
            where: { userId },
          },
        },
      },
    },
    orderBy: sortBy === 'newest' ? { createdAt: 'desc' } : { score: 'desc' },
  });

  const matchesWithNewFlag = matches.map((match) => ({
    ...match,
    isNew: match.job.seenJobs.length === 0,
  }));

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile & CV</h1>
      <ProfileForm profile={cvProfile} />

      {/* Job Matches Section */}
      <div className="mt-12 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Job Matches</h2>
            <p className="text-gray-600 mt-1">
              {matches.length} job{matches.length !== 1 ? 's' : ''} matching your profile
            </p>
          </div>
          <RefreshJobsButton userId={userId} hasProfile={true} />
        </div>

        {/* Filters */}
        <ProfileFilterForm
          initialLocation={location}
          initialRemote={remoteOnly}
          initialMinScore={minScore}
          initialSort={sortBy}
        />

        {/* Job List */}
        {matchesWithNewFlag.length > 0 ? (
          <div className="grid gap-6">
            {matchesWithNewFlag.map((match) => (
              <JobCard
                key={match.id}
                job={match.job}
                score={match.score}
                reasons={match.reasons}
                isNew={match.isNew}
                actions={
                  <>
                    <SaveJobButton jobId={match.job.id} userId={userId} />
                    <MarkAppliedButton jobId={match.job.id} userId={userId} />
                    <button className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                      View Details
                    </button>
                  </>
                }
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No matches found</h3>
            <p className="text-gray-600 mb-6">Click "Refresh Jobs" to find new matches</p>
          </div>
        )}
      </div>
    </div>
  );
}
