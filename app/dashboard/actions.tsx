'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SaveJobButton({ jobId, userId, isSaved = false }: { jobId: string; userId: string; isSaved?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [optimisticSaved, setOptimisticSaved] = useState(isSaved);
  const router = useRouter();

  // Update optimistic state when prop changes
  useState(() => {
    setOptimisticSaved(isSaved);
  });

  async function handleToggle() {
    // Optimistically update UI immediately
    const newSavedState = !optimisticSaved;
    setOptimisticSaved(newSavedState);
    setLoading(true);

    try {
      const endpoint = optimisticSaved ? '/api/dashboard/jobs/unsave' : '/api/dashboard/jobs/save';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      
      if (!res.ok) {
        // Revert on error
        setOptimisticSaved(!newSavedState);
        console.error('Failed to toggle save status');
      } else {
        // Background refresh without blocking UI
        setTimeout(() => router.refresh(), 100);
      }
    } catch (error) {
      // Revert on error
      setOptimisticSaved(!newSavedState);
      console.error('Error toggling save:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-4 py-2 text-sm rounded-lg transition-all disabled:opacity-50 ${
        optimisticSaved 
          ? 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200' 
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      {loading ? (optimisticSaved ? 'Unsaving...' : 'Saving...') : (optimisticSaved ? 'Click to unsave' : 'Save')}
    </button>
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
      className="px-4 py-2 text-sm text-green-700 border border-green-300 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
    >
      {loading ? 'Marking...' : 'Mark Applied'}
    </button>
  );
}
