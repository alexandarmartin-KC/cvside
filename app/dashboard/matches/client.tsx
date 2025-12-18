'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export { MarkAppliedButton } from '../actions';

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

export function SeedMockDataButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSeed() {
    if (!confirm('This will create 8 mock jobs. Continue?')) return;
    
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/seed-mock-jobs', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || 'Failed to create mock data');
      } else {
        setMessage(`✓ Created ${data.jobs} jobs with ${data.matches} matches`);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      setMessage('Error creating mock data');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleSeed}
        disabled={loading}
        className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Creating...' : '🎲 Seed Mock Data'}
      </button>
      {message && (
        <span className={`text-sm ${message.includes('✓') ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </span>
      )}
    </div>
  );
}

export function FilterForm({
  initialLocation,
  initialRadius,
  initialMinScore,
  initialSort,
}: {
  initialLocation: string;
  initialRadius: number;
  initialMinScore: number;
  initialSort: string;
}) {
  const router = useRouter();
  const [location, setLocation] = useState(initialLocation);
  const [radius, setRadius] = useState(initialRadius);
  const [minScore, setMinScore] = useState(initialMinScore);
  const [sort, setSort] = useState(initialSort);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (location) {
      params.set('location', location);
      if (radius > 0) params.set('radius', radius.toString());
    }
    if (minScore > 0) params.set('minScore', minScore.toString());
    if (sort !== 'Best Match') params.set('sort', sort);
    router.push(`/dashboard/matches?${params.toString()}`, { scroll: false });
  }

  function handleReset() {
    setLocation('');
    setRadius(0);
    setMinScore(0);
    setSort('Best Match');
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
            placeholder="e.g., Copenhagen"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Radius</label>
          <select
            value={radius}
            onChange={(e) => setRadius(parseInt(e.target.value))}
            disabled={!location}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="0">Any distance</option>
            <option value="10">10 km</option>
            <option value="25">25 km</option>
            <option value="50">50 km</option>
            <option value="100">100 km</option>
          </select>
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
