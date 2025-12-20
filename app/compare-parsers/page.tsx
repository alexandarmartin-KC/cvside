'use client';

import { useState } from 'react';

export default function CompareMethodsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<{ assistants: boolean; direct: boolean }>({
    assistants: false,
    direct: false
  });
  const [results, setResults] = useState<{ assistants: any; direct: any }>({
    assistants: null,
    direct: null
  });
  const [showJson, setShowJson] = useState<{ assistants: boolean; direct: boolean }>({
    assistants: false,
    direct: false
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResults({ assistants: null, direct: null });
    }
  };

  const testMethod = async (method: 'assistants' | 'direct') => {
    if (!file) return;

    setLoading(prev => ({ ...prev, [method]: true }));

    const endpoint = method === 'assistants' ? '/api/cv/parse-simple' : '/api/cv/parse-direct';
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      setResults(prev => ({ ...prev, [method]: data.profile || data }));
    } catch (err: any) {
      setResults(prev => ({ ...prev, [method]: { error: err.message } }));
    } finally {
      setLoading(prev => ({ ...prev, [method]: false }));
    }
  };

  const testBoth = async () => {
    if (!file) return;
    await Promise.all([testMethod('assistants'), testMethod('direct')]);
  };

  const countBullets = (profile: any) => {
    if (!profile || !profile.experience) return 0;
    return profile.experience.reduce((sum: number, exp: any) => sum + (exp.bullets?.length || 0), 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">🔬 Parser Comparison</h1>
          <p className="text-gray-600 mb-6">Compare Assistants API vs Direct Text parsing</p>

          <div className="space-y-4">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50"
            />

            <div className="flex gap-3">
              <button
                onClick={testBoth}
                disabled={!file || loading.assistants || loading.direct}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300"
              >
                {(loading.assistants || loading.direct) ? '⏳ Testing...' : '🚀 Test Both Methods'}
              </button>
            </div>
          </div>
        </div>

        {(results.assistants || results.direct) && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Assistants API Result */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">🤖 Assistants API</h2>
                {results.assistants && !results.assistants.error && (
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {countBullets(results.assistants)} total bullets
                  </span>
                )}
              </div>

              {loading.assistants ? (
                <p className="text-gray-500">Loading...</p>
              ) : results.assistants?.error ? (
                <p className="text-red-600">{results.assistants.error}</p>
              ) : results.assistants ? (
                <div className="space-y-4">
                  <button
                    onClick={() => setShowJson(prev => ({ ...prev, assistants: !prev.assistants }))}
                    className="w-full bg-blue-50 text-blue-700 py-2 px-3 rounded font-medium text-sm hover:bg-blue-100"
                  >
                    {showJson.assistants ? '👁️ Hide JSON' : '📋 Show Full JSON'}
                  </button>
                  
                  {showJson.assistants && (
                    <div className="bg-gray-900 rounded p-4">
                      <pre className="text-green-400 text-xs overflow-auto max-h-96">
                        {JSON.stringify(results.assistants, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {results.assistants.experience?.map((exp: any, idx: number) => (
                    <div key={idx} className="border-l-4 border-blue-500 pl-4">
                      <p className="font-semibold text-sm">{exp.role}</p>
                      <p className="text-xs text-gray-600">{exp.company}</p>
                      <p className="text-xs text-blue-600 font-semibold mt-1">
                        {exp.bullets?.length || 0} bullets
                      </p>
                      {exp.bullets && exp.bullets.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {exp.bullets.map((b: string, bidx: number) => (
                            <li key={bidx} className="text-xs text-gray-700">• {b}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No result yet</p>
              )}
            </div>

            {/* Direct Text Result */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">📝 Direct Text</h2>
                {results.direct && !results.direct.error && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                    {countBullets(results.direct)} total bullets
                  </span>
                )}
              </div>

              {loading.direct ? (
                <p className="text-gray-500">Loading...</p>
              ) : results.direct?.error ? (
                <p className="text-red-600">{results.direct.error}</p>
              ) : results.direct ? (
                <div className="space-y-4">
                  <button
                    onClick={() => setShowJson(prev => ({ ...prev, direct: !prev.direct }))}
                    className="w-full bg-green-50 text-green-700 py-2 px-3 rounded font-medium text-sm hover:bg-green-100"
                  >
                    {showJson.direct ? '👁️ Hide JSON' : '📋 Show Full JSON'}
                  </button>
                  
                  {showJson.direct && (
                    <div className="bg-gray-900 rounded p-4">
                      <pre className="text-green-400 text-xs overflow-auto max-h-96">
                        {JSON.stringify(results.direct, null, 2)}
                      </pre>
                    </div>
                  )}
                  
                  {results.direct.experience?.map((exp: any, idx: number) => (
                    <div key={idx} className="border-l-4 border-green-500 pl-4">
                      <p className="font-semibold text-sm">{exp.role}</p>
                      <p className="text-xs text-gray-600">{exp.company}</p>
                      <p className="text-xs text-green-600 font-semibold mt-1">
                        {exp.bullets?.length || 0} bullets
                      </p>
                      {exp.bullets && exp.bullets.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {exp.bullets.map((b: string, bidx: number) => (
                            <li key={bidx} className="text-xs text-gray-700">• {b}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No result yet</p>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <a href="/test-parser" className="text-blue-600 hover:underline">
            ← Back to Test Parser
          </a>
        </div>
      </div>
    </div>
  );
}
