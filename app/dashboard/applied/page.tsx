import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AppliedJobCard, UpdateStatusModal } from './client';
import type { AppliedJobStatus } from '@prisma/client';

export default async function AppliedJobsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const appliedJobs = await prisma.appliedJob.findMany({
    where: { userId },
    include: {
      job: {
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          remote: true,
          description: true,
          skills: true,
          sourceUrl: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });

  const jobsByStatus: Record<AppliedJobStatus, typeof appliedJobs> = {
    SAVED: [],
    APPLIED: [],
    INTERVIEW: [],
    OFFER: [],
    REJECTED: [],
  };

  appliedJobs.forEach((job) => {
    jobsByStatus[job.status].push(job);
  });

  const statusConfig: Record<AppliedJobStatus, { label: string; color: string }> = {
    SAVED: { label: 'Saved', color: 'bg-gray-100 border-gray-300' },
    APPLIED: { label: 'Applied', color: 'bg-blue-100 border-blue-300' },
    INTERVIEW: { label: 'Interview', color: 'bg-purple-100 border-purple-300' },
    OFFER: { label: 'Offer', color: 'bg-green-100 border-green-300' },
    REJECTED: { label: 'Rejected', color: 'bg-red-100 border-red-300' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Applied Jobs</h1>
        <p className="text-gray-600 mt-1">
          Track your application pipeline
        </p>
      </div>

      {/* Pipeline Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {(Object.keys(jobsByStatus) as AppliedJobStatus[]).map((status) => (
          <div key={status} className="flex flex-col">
            <div className={`p-3 rounded-t-lg border-2 ${statusConfig[status].color}`}>
              <h3 className="font-semibold text-gray-900">{statusConfig[status].label}</h3>
              <p className="text-xs text-gray-600 mt-1">
                {jobsByStatus[status].length} job{jobsByStatus[status].length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex-1 space-y-3 p-3 bg-gray-50 rounded-b-lg border-x-2 border-b-2 border-gray-200 min-h-[200px]">
              {jobsByStatus[status].map((appliedJob) => (
                <AppliedJobCard
                  key={appliedJob.id}
                  appliedJob={appliedJob}
                  job={appliedJob.job}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {appliedJobs.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications yet</h3>
          <p className="text-gray-600">Start applying to jobs to track them here</p>
        </div>
      )}
    </div>
  );
}
