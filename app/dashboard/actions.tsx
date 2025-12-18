'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SaveJobButton({ jobId, userId, isSaved = false }: { jobId: string; userId: string; isSaved?: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleToggle() {
    setLoading(true);
    try {
      const endpoint = isSaved ? '/api/dashboard/jobs/unsave' : '/api/dashboard/jobs/save';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      
      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    } finally {
      setLoading(false);
    }
  }

  const getButtonText = () => {
    if (loading) {
      return isSaved ? 'Unsaving...' : 'Saving...';
    }
    return isSaved ? 'Saved' : 'Save';
  };

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handleToggle}
        disabled={loading}
        className="min-w-[120px] px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
      >
        {getButtonText()}
      </button>
      {isSaved && !loading && (
        <span className="text-xs text-gray-500 ml-1">Click to unsave</span>
      )}
    </div>
  );
}

export function MarkAppliedButton({ jobId, userId }: { jobId: string; userId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleApply() {
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

  return (
    <button
      onClick={handleApply}
      disabled={loading}
      className="min-w-[120px] px-4 py-2 text-sm text-green-700 border border-green-300 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
    >
      {loading ? 'Marking...' : 'Mark Applied'}
    </button>
  );
}
