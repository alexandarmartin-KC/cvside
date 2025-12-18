'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ProfileFilterForm({
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
    router.push(`/dashboard/profile?${params.toString()}`);
  }

  function handleReset() {
    setLocation('');
    setRadius(0);
    setMinScore(0);
    setSort('Best Match');
    router.push('/dashboard/profile');
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
