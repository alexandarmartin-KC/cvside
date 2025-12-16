import { protectRoute } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { JobCard } from '@/components/JobCard';
import { UnsaveJobButton, MoveToAppliedButton } from './client';

export default async function SavedJobsPage() {
  const session = await protectRoute();
  const userId = session.user.id;

  const savedJobs = await prisma.savedJob.findMany({
    where: { userId },
    include: {
      job: {
        include: {
          jobMatches: {
            where: { userId },
            take: 1,
          },
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Saved Jobs</h1>
        <p className="text-gray-600 mt-1">
          {savedJobs.length} saved job{savedJobs.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Job List */}
      {savedJobs.length > 0 ? (
        <div className="grid gap-6">
          {savedJobs.map((saved) => {
            const match = saved.job.jobMatches[0];
            return (
              <JobCard
                key={saved.id}
                job={saved.job}
                score={match?.score}
                reasons={match?.reasons}
                actions={
                  <>
                    <MoveToAppliedButton savedJobId={saved.id} jobId={saved.job.id} />
                    <UnsaveJobButton savedJobId={saved.id} />
                  </>
                }
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved jobs yet</h3>
          <p className="text-gray-600">Save jobs from your matches to keep track of them</p>
        </div>
      )}
    </div>
  );
}
