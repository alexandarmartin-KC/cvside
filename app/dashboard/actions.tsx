'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SaveJobButton({ jobId, userId }: { jobId: string; userId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/jobs/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
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
      onClick={handleSave}
      disabled={loading}
      className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
    >
      {loading ? 'Saving...' : 'Save'}
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
