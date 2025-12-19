'use client';
import React, { useState } from 'react';
import { JobCard } from '@/components/JobCard';
import { SaveJobButton } from '../actions';
import { MarkAppliedButton } from './client';

export function MatchesClient({
  matchesWithNewFlag,
  userId,
}: {
  matchesWithNewFlag: any[];
  userId: string;
}) {
  const [savedMap, setSavedMap] = useState(() => {
    const map: Record<string, boolean> = {};
    matchesWithNewFlag.forEach(match => {
      map[match.job.id] = match.job.savedJobs && match.job.savedJobs.length > 0;
    });
    return map;
  });
  const [loadingMap, setLoadingMap] = useState<Record<string, null | 'save' | 'unsave'>>({});

  const handleToggleSave = async (jobId: string) => {
    const isSaved = savedMap[jobId];
    const next = !isSaved;
    setLoadingMap(lm => ({ ...lm, [jobId]: next ? 'save' : 'unsave' }));
    setSavedMap(sm => ({ ...sm, [jobId]: next }));
    try {
      const endpoint = next ? '/api/dashboard/jobs/save' : '/api/dashboard/jobs/unsave';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      if (!res.ok) setSavedMap(sm => ({ ...sm, [jobId]: isSaved }));
    } catch {
      setSavedMap(sm => ({ ...sm, [jobId]: isSaved }));
    } finally {
      setLoadingMap(lm => ({ ...lm, [jobId]: null }));
    }
  };

  return (
    <div className="grid gap-6">
      {matchesWithNewFlag.map((match) => (
        <JobCard
          key={match.id}
          job={match.job}
          score={match.score}
          reasons={match.reasons}
          isNew={match.isNew}
          isSaved={savedMap[match.job.id]}
          appliedAt={match.appliedAt}
          showTailorButton={false}
          actions={
            <>
              <SaveJobButton
                isSaved={savedMap[match.job.id]}
                loading={loadingMap[match.job.id] || null}
                onToggle={() => handleToggleSave(match.job.id)}
              />
              <MarkAppliedButton jobId={match.job.id} userId={userId} />
              <button className="w-[140px] px-4 py-2 text-sm text-center text-gray-700 border border-gray-300 hover:bg-gray-100 rounded-lg transition-colors">
                View Details
              </button>
            </>
          }
        />
      ))}
    </div>
  );
}
