'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function SaveJobButton({ jobId, userId, isSaved = false }: { jobId: string; userId: string; isSaved?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
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
        if (!isSaved) {
          // Just saved - show "Saved" briefly
          setJustSaved(true);
          setTimeout(() => {
            setJustSaved(false);
            router.refresh();
          }, 800);
        } else {
          // Unsaved - refresh immediately
          router.refresh();
        }
      }
    } finally {
      setLoading(false);
    }
  }

  const getButtonText = () => {
    if (loading) {
      return isSaved ? 'Unsaving...' : 'Saving...';
    }
    if (justSaved) {
      return 'Saved!';
    }
    return isSaved ? 'Unsave' : 'Save';
  };

  const getButtonStyle = () => {
    if (isSaved) {
      return 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200';
    }
    if (justSaved) {
      return 'bg-green-600 text-white';
    }
    return 'bg-blue-600 text-white hover:bg-blue-700';
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading || justSaved}
      className={`px-4 py-2 text-sm rounded-lg transition-colors disabled:opacity-50 ${getButtonStyle()}`}
    >
      {getButtonText()}
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
