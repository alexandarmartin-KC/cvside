'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AppliedJobStatus } from '@prisma/client';

type AppliedJobWithJob = {
  id: string;
  status: AppliedJobStatus;
  appliedAt: Date | null;
  notes: string | null;
  updatedAt: Date;
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
  };
};

export function AppliedJobCard({
  appliedJob,
  job,
}: {
  appliedJob: AppliedJobWithJob;
  job: AppliedJobWithJob['job'];
}) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className="bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
      >
        <h4 className="font-semibold text-sm text-gray-900 mb-1">{job.title}</h4>
        <p className="text-xs text-gray-600 mb-2">{job.company}</p>
        {appliedJob.appliedAt && (
          <p className="text-xs text-gray-500">
            {new Date(appliedJob.appliedAt).toLocaleDateString()}
          </p>
        )}
        {appliedJob.notes && (
          <p className="text-xs text-gray-600 mt-2 line-clamp-2">{appliedJob.notes}</p>
        )}
      </div>

      {showModal && (
        <JobDetailsModal
          appliedJob={appliedJob}
          job={job}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}

function JobDetailsModal({
  appliedJob,
  job,
  onClose,
}: {
  appliedJob: AppliedJobWithJob;
  job: AppliedJobWithJob['job'];
  onClose: () => void;
}) {
  const [status, setStatus] = useState<AppliedJobStatus>(appliedJob.status);
  const [notes, setNotes] = useState(appliedJob.notes || '');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/jobs/update-applied', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appliedJobId: appliedJob.id,
          status,
          notes,
        }),
      });
      if (res.ok) {
        router.refresh();
        onClose();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{job.title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-gray-600 font-medium">{job.company}</p>
            <p className="text-sm text-gray-500">{job.location}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AppliedJobStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="SAVED">Saved</option>
              <option value="APPLIED">Applied</option>
              <option value="INTERVIEW">Interview</option>
              <option value="OFFER">Offer</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Add notes about this application..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {appliedJob.appliedAt && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Applied:</span>{' '}
              {new Date(appliedJob.appliedAt).toLocaleDateString()}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UpdateStatusModal() {
  return null;
}
