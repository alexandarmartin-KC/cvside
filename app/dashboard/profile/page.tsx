import { requireUser } from '@/lib/auth-session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { ProfileForm } from './client';
import { JobCard } from '@/components/JobCard';
import { SaveJobButton } from '../actions';
import { MarkAppliedButton, RefreshJobsButton, SeedMockDataButton } from '../matches/client';
import { ProfileFilterForm } from './filter-form';
import { filterAndSortJobs } from '@/lib/job-filter-engine';

export const dynamic = 'force-dynamic';

type SearchParams = {
  location?: string;
  radius?: string;
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
  const radius = parseInt(params.radius || '0');
  const minScore = params.minScore || '';
  const sortBy = params.sort || '';

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
          appliedJobs: {
            where: { userId },
          },
        },
      },
    },
  });

  console.log('=== PROFILE PAGE DEBUG ===');
  console.log('User ID:', userId);
  console.log('Total matches found:', allMatches.length);
  console.log('CV Profile:', cvProfile.title, '-', cvProfile.seniority);
  console.log('Sample match with saved status:', allMatches[0] ? {
    jobId: allMatches[0].job.id,
    jobTitle: allMatches[0].job.title,
    savedJobs: allMatches[0].job.savedJobs,
    isSaved: allMatches[0].job.savedJobs?.length > 0
  } : 'No matches');

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
  const filteredJobIds = new Set(filterResult.filtered_jobs.map(j => j.job_id));
  const orderedMatches = filterResult.filtered_jobs
    .map(filteredJob => allMatches.find(m => m.job.id === filteredJob.job_id)!)
    .filter(Boolean);

  const matchesWithNewFlag = orderedMatches.map((match) => ({
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
              {matchesWithNewFlag.length} job{matchesWithNewFlag.length !== 1 ? 's' : ''} matching your profile
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SeedMockDataButton />
            <RefreshJobsButton userId={userId} hasProfile={true} />
          </div>
        </div>

        {/* Filters */}
        <ProfileFilterForm
          initialLocation={filterResult.applied_filters.location || ''}
          initialRadius={filterResult.applied_filters.radius_km || 0}
          initialMinScore={filterResult.applied_filters.minimum_score === 'Any' ? 0 : filterResult.applied_filters.minimum_score}
          initialSort={filterResult.applied_filters.sort_by}
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
                isSaved={match.job.savedJobs?.length > 0}
                appliedAt={match.job.appliedJobs?.[0]?.appliedAt || null}
                actions={
                  <>
                    <SaveJobButton 
                      jobId={match.job.id} 
                      userId={userId} 
                      isSaved={match.job.savedJobs?.length > 0}
                    />
                    <MarkAppliedButton jobId={match.job.id} userId={userId} />
                    <button className="w-[140px] px-4 py-2 text-sm text-center text-gray-700 border border-gray-300 hover:bg-gray-100 rounded-lg transition-colors">
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
