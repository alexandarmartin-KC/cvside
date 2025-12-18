
'use client';
import React, { useRef } from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export type SaveJobButtonProps = {
  isSaved: boolean;
  loading: null | 'save' | 'unsave';
  onToggle: () => void;
};

export function SaveJobButton({ isSaved, loading, onToggle }: SaveJobButtonProps) {
  let buttonText = 'Save';
  if (loading === 'save') buttonText = 'Saving...';
  else if (loading === 'unsave') buttonText = 'Unsaving...';
  else if (isSaved) buttonText = 'Unsave';

  return (
    <button
      onClick={onToggle}
      disabled={loading !== null}
      className="w-[140px] px-4 py-2 text-sm text-center bg-blue-600 text-white border border-blue-600 rounded-lg hover:bg-blue-700 hover:border-blue-700 transition-all disabled:opacity-50"
    >
      {buttonText}
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
      className="w-[140px] px-4 py-2 text-sm text-center text-green-700 border border-green-300 rounded-lg hover:bg-green-50 transition-colors disabled:opacity-50"
    >
      {loading ? 'Marking...' : 'Mark Applied'}
    </button>
  );
}
