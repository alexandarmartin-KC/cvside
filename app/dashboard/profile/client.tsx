'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type CvProfile = {
  id: string;
  name: string | null;
  title: string | null;
  seniority: string | null;
  summary: string | null;
  skills: string[];
  locations: string[];
  preferredLocation: string | null;
};

export function ProfileForm({ profile }: { profile: CvProfile }) {
  const [skills, setSkills] = useState<string[]>(profile.skills);
  const [locations, setLocations] = useState<string[]>(profile.locations);
  const [preferredLocation, setPreferredLocation] = useState(profile.preferredLocation || '');
  const [skillInput, setSkillInput] = useState('');
  const [locationInput, setLocationInput] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function handleAddSkill() {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput('');
    }
  }

  function handleRemoveSkill(skill: string) {
    setSkills(skills.filter((s) => s !== skill));
  }

  function handleAddLocation() {
    const trimmed = locationInput.trim();
    if (trimmed && !locations.includes(trimmed)) {
      setLocations([...locations, trimmed]);
      setLocationInput('');
    }
  }

  function handleRemoveLocation(location: string) {
    setLocations(locations.filter((l) => l !== location));
  }

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills,
          locations,
          preferredLocation,
        }),
      });
      if (res.ok) {
        router.refresh();
        alert('Profile updated successfully!');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
      {/* Basic Info */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={profile.name || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={profile.title || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
        </div>
      </div>

      {/* Skills */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
            placeholder="Add a skill..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleAddSkill}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg flex items-center gap-2"
            >
              {skill}
              <button
                onClick={() => handleRemoveSkill(skill)}
                className="text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Locations */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Locations</h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLocation())}
            placeholder="Add a location..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={handleAddLocation}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {locations.map((location) => (
            <span
              key={location}
              className="px-3 py-1.5 bg-purple-100 text-purple-800 rounded-lg flex items-center gap-2"
            >
              {location}
              <button
                onClick={() => handleRemoveLocation(location)}
                className="text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Preferred Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preferred Location
        </label>
        <select
          value={preferredLocation}
          onChange={(e) => setPreferredLocation(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select preferred location</option>
          {locations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>
      </div>

      {/* Save Button */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

export function RecomputeMatchesButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRecompute() {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/jobs/refresh', {
        method: 'POST',
      });
      if (res.ok) {
        router.refresh();
        alert('Matches recomputed successfully!');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleRecompute}
      disabled={loading}
      className="px-4 py-2 text-sm bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
    >
      {loading ? 'Recomputing...' : 'Recompute Matches'}
    </button>
  );
}
