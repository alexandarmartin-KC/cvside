'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export { SaveJobButton, MarkAppliedButton } from '../actions';

export function RefreshJobsButton({ userId, hasProfile }: { userId: string; hasProfile: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRefresh() {
    if (!hasProfile) {
      router.push('/upload');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/jobs/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      onClick={handleRefresh}
      disabled={loading}
      className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
    >
      {loading ? (
        <>
          <svg className="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refreshing...
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Jobs
        </>
      )}
    </button>
  );
}

export function FilterForm({
  initialLocation,
  initialRemote,
  initialMinScore,
  initialSort,
}: {
  initialLocation: string;
  initialRemote: boolean;
  initialMinScore: number;
  initialSort: string;
}) {
  const router = useRouter();
  const [location, setLocation] = useState(initialLocation);
  const [remote, setRemote] = useState(initialRemote);
  const [minScore, setMinScore] = useState(initialMinScore);
  const [sort, setSort] = useState(initialSort);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (remote) params.set('remote', 'true');
    if (minScore > 0) params.set('minScore', minScore.toString());
    if (sort !== 'score') params.set('sort', sort);
    router.push(`/dashboard/matches?${params.toString()}`);
  }

  function handleReset() {
    setLocation('');
    setRemote(false);
    setMinScore(0);
    setSort('score');
    router.push('/dashboard/matches');
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., London"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Score</label>
          <select
            value={minScore}
            onChange={(e) => setMinScore(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="0">Any</option>
            <option value="50">50+</option>
            <option value="60">60+</option>
            <option value="70">70+</option>
            <option value="80">80+</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="Best Match">Best Match</option>
            <option value="Newest">Newest</option>
            <option value="Oldest">Oldest</option>
            <option value="Company A–Z">Company A–Z</option>
          </select>
        </div>

        <div className="flex items-end gap-2">
          <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={remote}
              onChange={(e) => setRemote(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Remote only</span>
          </label>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Apply Filters
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Reset
        </button>
      </div>
    </form>
  );
}
