'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function UnsaveJobButton({ savedJobId }: { savedJobId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleUnsave() {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/jobs/unsave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ savedJobId }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleUnsave}
      disabled={loading}
      className="px-4 py-2 text-sm text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
    >
      {loading ? 'Removing...' : 'Remove'}
    </button>
  );
}

export function MoveToAppliedButton({ savedJobId, jobId }: { savedJobId: string; jobId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleMoveToApplied() {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/jobs/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, status: 'APPLIED' }),
      });
      if (res.ok) {
        // Job is now marked as applied, but still stays in saved jobs
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleMoveToApplied}
      disabled={loading}
      className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
    >
      {loading ? 'Marking...' : 'Mark as Applied'}
    </button>
  );
}
