import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { JobCard } from '@/components/JobCard';
import { RefreshJobsButton, FilterForm } from './client';
import { MatchesClient } from './MatchesClient';
import { filterAndSortJobs } from '@/lib/job-filter-engine';

export const dynamic = 'force-dynamic';

type SearchParams = {
  location?: string;
  radius?: string;
  minScore?: string;
  sort?: string;
};

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await auth();
  if (!session?.user) {
    return <div>Not authenticated</div>;
  }
  
  const userId = session.user.id;
  const isTestUser = userId.startsWith('test-');

  const params = await searchParams;
  const location = params.location || '';
  const radius = parseInt(params.radius || '0');
  const minScore = params.minScore || '';
  const sortBy = params.sort || '';

  // For test users, show empty state
  if (isTestUser) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Matches</h1>
            <p className="text-gray-600 mt-1">Upload your CV to get personalized job matches</p>
          </div>
        </div>
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No matches yet</h3>
          <p className="text-gray-600 mb-6">Upload your CV to get personalized job matches</p>
        </div>
      </div>
    );
  }

  // Fetch ALL job matches (no filtering at DB level)
  const allMatches = await prisma.jobMatch.findMany({
    where: {
      userId,
    },
    include: {
      job: {
        include: {
          seenJobs: {
            where: { userId },
          },
          savedJobs: {
            where: { userId },
          },
        },
      },
    },
  });

  const cvProfile = await prisma.cvProfile.findUnique({
    where: { userId },
  });

  // Transform to filtering engine format
  const jobs = allMatches.map(match => ({
    job_id: match.job.id,
    title: match.job.title,
    company: match.job.company,
    location: match.job.location,
    score: match.score,
    posted_at: match.job.createdAt?.toISOString() || null,
  }));

  // Apply deterministic filtering and sorting
  const filterResult = filterAndSortJobs(jobs, {
    location: location || null,
    radius_km: radius || null,
    minimum_score: minScore || null,
    sort_by: sortBy || null,
  });

  // Map filtered jobs back to matches with full data
  const orderedMatches = filterResult.filtered_jobs
    .map(filteredJob => allMatches.find(m => m.job.id === filteredJob.job_id)!)
    .filter(Boolean);

  const matchesWithNewFlag = orderedMatches.map((match) => ({
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
            {matchesWithNewFlag.length} job{matchesWithNewFlag.length !== 1 ? 's' : ''} matching your profile
          </p>
        </div>
        <RefreshJobsButton userId={userId} hasProfile={!!cvProfile} />
      </div>

      {/* Filters */}
      <FilterForm
        initialLocation={filterResult.applied_filters.location || ''}
        initialRadius={filterResult.applied_filters.radius_km || 0}
        initialMinScore={filterResult.applied_filters.minimum_score === 'Any' ? 0 : filterResult.applied_filters.minimum_score}
        initialSort={filterResult.applied_filters.sort_by}
      />

      {/* Job List */}
      {matchesWithNewFlag.length > 0 ? (
        <MatchesClient matchesWithNewFlag={matchesWithNewFlag} userId={userId} />
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
