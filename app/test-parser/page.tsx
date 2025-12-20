'use client';

import { useState } from 'react';

export default function TestParserPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setError(null);
    }
  };

  const testParser = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/cv/parse-simple', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Parse failed');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold mb-2">🔍 CV Parser Test</h1>
          <p className="text-gray-600 mb-8">Upload a CV to see exactly what data is extracted</p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload PDF
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none"
              />
            </div>

            <button
              onClick={testParser}
              disabled={!file || loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ Parsing...' : '🚀 Test Parser'}
            </button>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-red-800 font-semibold mb-2">❌ Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {result && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-green-800 font-bold text-xl mb-4">✅ Extraction Successful!</h3>
                
                <div className="space-y-6">
                  {/* Name & Contact */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">👤 Personal Info</h4>
                    <div className="bg-white rounded p-3 space-y-1 text-sm">
                      <p><span className="font-medium">Name:</span> {result.profile.name || 'N/A'}</p>
                      <p><span className="font-medium">Title:</span> {result.profile.title || 'N/A'}</p>
                      <p><span className="font-medium">Email:</span> {result.profile.contact?.email || 'N/A'}</p>
                      <p><span className="font-medium">Phone:</span> {result.profile.contact?.phone || 'N/A'}</p>
                      <p><span className="font-medium">Location:</span> {result.profile.contact?.location || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Experience */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      💼 Experience ({result.profile.experience?.length || 0} jobs)
                    </h4>
                    {result.profile.experience && result.profile.experience.length > 0 ? (
                      <div className="space-y-4">
                        {result.profile.experience.map((exp: any, idx: number) => (
                          <div key={idx} className="bg-white rounded p-4 border-l-4 border-blue-500">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-bold text-gray-900">{exp.role}</p>
                                <p className="text-gray-700">{exp.company}</p>
                              </div>
                              <div className="text-right text-sm text-gray-600">
                                <p>{exp.start_date} - {exp.end_date}</p>
                                {exp.location && <p>{exp.location}</p>}
                              </div>
                            </div>
                            
                            {exp.bullets && exp.bullets.length > 0 ? (
                              <div className="mt-3">
                                <p className="text-sm font-semibold text-gray-700 mb-1">
                                  Bullets ({exp.bullets.length}):
                                </p>
                                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                  {exp.bullets.map((bullet: string, bidx: number) => (
                                    <li key={bidx}>{bullet}</li>
                                  ))}
                                </ul>
                              </div>
                            ) : (
                              <p className="text-sm text-red-600 mt-2">⚠️ No bullets extracted!</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-red-600">⚠️ No experience extracted!</p>
                    )}
                  </div>

                  {/* Education */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      🎓 Education ({result.profile.education?.length || 0})
                    </h4>
                    {result.profile.education && result.profile.education.length > 0 ? (
                      <div className="space-y-2">
                        {result.profile.education.map((edu: any, idx: number) => (
                          <div key={idx} className="bg-white rounded p-3 text-sm">
                            <p className="font-semibold">{edu.degree} {edu.field ? `in ${edu.field}` : ''}</p>
                            <p className="text-gray-700">{edu.institution}</p>
                            <p className="text-gray-600">{edu.start_date} - {edu.end_date}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-red-600">⚠️ No education extracted!</p>
                    )}
                  </div>

                  {/* Skills */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      ⚡ Skills ({result.profile.skills?.length || 0})
                    </h4>
                    {result.profile.skills && result.profile.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {result.profile.skills.map((skill: string, idx: number) => (
                          <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-red-600">⚠️ No skills extracted!</p>
                    )}
                  </div>

                  {/* Languages */}
                  {result.profile.languages && result.profile.languages.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        🌍 Languages ({result.profile.languages.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {result.profile.languages.map((lang: string, idx: number) => (
                          <span key={idx} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Raw JSON */}
                  <details className="mt-6">
                    <summary className="cursor-pointer font-semibold text-gray-900 hover:text-blue-600">
                      📋 View Raw JSON
                    </summary>
                    <pre className="mt-2 bg-gray-900 text-green-400 p-4 rounded text-xs overflow-auto max-h-96">
                      {JSON.stringify(result.profile, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <a href="/upload?wizard=true" className="text-blue-600 hover:underline">
            ← Back to Upload Page
          </a>
        </div>
      </div>
    </div>
  );
}
