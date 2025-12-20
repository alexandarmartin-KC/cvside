'use client';

import { useState } from 'react';

export default function DebugCV() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleDebugParse = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/cv/parse-debug', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
      setResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🔍 CV Parser Debugger</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Upload Your CV</h2>
          <p className="text-gray-600 mb-4">
            This will show you exactly what text is extracted from your PDF, 
            so we can see why experience data is missing.
          </p>
          
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100
              mb-4"
          />
          
          <button
            onClick={handleDebugParse}
            disabled={!file || loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Debug Parse CV'}
          </button>
        </div>

        {result && (
          <div className="space-y-6">
            {result.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-red-800 font-semibold mb-2">❌ Error</h3>
                <pre className="text-red-700 text-sm overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}

            {result.success && (
              <>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-green-800 font-semibold mb-2">✅ Successfully Extracted</h3>
                  <p className="text-green-700">Text Length: {result.textLength} characters</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">📄 First 3000 Characters</h3>
                  <pre className="text-sm bg-gray-50 p-4 rounded overflow-auto whitespace-pre-wrap border">
                    {result.preview}
                  </pre>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">📋 First 100 Lines</h3>
                  <div className="space-y-1 max-h-96 overflow-auto">
                    {result.lines?.map((line: string, idx: number) => (
                      <div key={idx} className="text-sm font-mono border-b border-gray-100 py-1">
                        <span className="text-gray-400 mr-4">{idx + 1}.</span>
                        <span className="text-gray-800">{line || '(empty line)'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h3 className="text-yellow-800 font-semibold mb-4">💡 What to Look For</h3>
                  <ul className="space-y-2 text-yellow-900 text-sm">
                    <li>✓ Can you see your company names (Ørsted, G4S, Securitas)?</li>
                    <li>✓ Are the dates next to the companies?</li>
                    <li>✓ Are your job titles visible?</li>
                    <li>✓ Is the text garbled or has weird spacing?</li>
                    <li>✓ Are there section headers like "Experience" or "Arbejdserfaring"?</li>
                  </ul>
                  <p className="mt-4 text-yellow-800 font-medium">
                    Share this output so we can fix the parser to work with your CV format!
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">📊 Full Raw Text</h3>
                  <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto whitespace-pre-wrap border max-h-[600px]">
                    {result.rawText}
                  </pre>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
