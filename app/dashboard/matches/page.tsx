import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { JobCard } from '@/components/JobCard';
import { SaveJobButton, MarkAppliedButton, RefreshJobsButton, FilterForm } from './client';

type SearchParams = {
  location?: string;
  remote?: string;
  minScore?: string;
  sort?: string;
};

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  const userId = session!.user.id;

  const location = searchParams.location || '';
  const remoteOnly = searchParams.remote === 'true';
  const minScore = parseInt(searchParams.minScore || '0');
  const sortBy = searchParams.sort || 'score'; // 'score' or 'newest'

  // Build where clause
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

  const cvProfile = await prisma.cvProfile.findUnique({
    where: { userId },
  });

  const matchesWithNewFlag = matches.map((match) => ({
    ...match,
    isNew: match.job.seenJobs.length === 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Matches</h1>
          <p className="text-gray-600 mt-1">
            {matches.length} job{matches.length !== 1 ? 's' : ''} matching your profile
          </p>
        </div>
        <RefreshJobsButton userId={userId} hasProfile={!!cvProfile} />
      </div>

      {/* Filters */}
      <FilterForm
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
          <p className="text-gray-600 mb-6">
            {cvProfile
              ? 'Click "Refresh Jobs" to find new matches'
              : 'Upload your CV to get personalized job matches'}
          </p>
        </div>
      )}
    </div>
  );
}
