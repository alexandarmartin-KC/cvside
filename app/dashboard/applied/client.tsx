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
    remote: boolean;
    description: string;
    skills: string[];
    sourceUrl: string | null;
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
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className="bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all">
        <div onClick={() => setShowModal(true)} className="cursor-pointer">
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

        {/* Read Description Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="mt-2 w-full text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1"
          aria-expanded={expanded}
        >
          Read full job description
          <svg
            className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Expanded Description */}
        <div
          className={`overflow-hidden transition-all duration-300 ${
            expanded ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="border-t border-gray-200 pt-3 space-y-3">
            {/* Location & Remote */}
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {job.location}
              {job.remote && (
                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  Remote
                </span>
              )}
            </div>

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1">Skills:</p>
                <div className="flex flex-wrap gap-1">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <p className="text-xs font-medium text-gray-700 mb-1">Description:</p>
              <div className="text-xs text-gray-600 max-h-48 overflow-y-auto whitespace-pre-wrap">
                {job.description || <span className="text-gray-400 italic">Full description not available</span>}
              </div>
            </div>

            {/* Original Posting Link */}
            {job.sourceUrl && (
              <a
                href={job.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open original posting
              </a>
            )}
          </div>
        </div>
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
