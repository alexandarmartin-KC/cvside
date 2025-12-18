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

export function MoveToAppliedButton({ 
  savedJobId, 
  jobId, 
  isApplied 
}: { 
  savedJobId: string; 
  jobId: string; 
  isApplied: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleMarkApplied() {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/jobs/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, status: 'APPLIED' }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleUnmarkApplied() {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/jobs/unapply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      if (res.ok) {
        window.location.reload();
      } else {
        console.error('Failed to unmark job:', await res.text());
        setLoading(false);
      }
    } catch (error) {
      console.error('Error unmarking job:', error);
      setLoading(false);
    }
  }

  if (isApplied) {
    return (
      <button
        onClick={handleUnmarkApplied}
        disabled={loading}
        className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        {loading ? 'Unmarking...' : 'Unmark as Applied'}
      </button>
    );
  }

  return (
    <button
      onClick={handleMarkApplied}
      disabled={loading}
      className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
    >
      {loading ? 'Marking...' : 'Mark as Applied'}
    </button>
  );
}
