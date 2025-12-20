'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function QuickTestPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);

  // Test database connection
  const testDatabase = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      setDbStatus(data);
    } catch (error) {
      setDbStatus({ error: error instanceof Error ? error.message : 'Failed' });
    }
    setLoading(false);
  };

  // Test authentication
  const testAuth = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/check-session');
      if (response.ok) {
        const data = await response.json();
        setAuthStatus({ loggedIn: true, user: data.user });
      } else {
        setAuthStatus({ loggedIn: false });
      }
    } catch (error) {
      setAuthStatus({ error: error instanceof Error ? error.message : 'Failed' });
    }
    setLoading(false);
  };

  // Test signup
  const testSignup = async () => {
    setLoading(true);
    const randomEmail = `test${Date.now()}@example.com`;
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: randomEmail,
          password: 'testpassword123',
          name: 'Test User'
        })
      });
      const data = await response.json();
      setTestResult({
        type: 'signup',
        success: response.ok,
        status: response.status,
        email: randomEmail,
        data
      });
    } catch (error) {
      setTestResult({
        type: 'signup',
        success: false,
        error: error instanceof Error ? error.message : 'Failed'
      });
    }
    setLoading(false);
  };

  // Test CV upload (without auth)
  const testCVUpload = async () => {
    setLoading(true);
    
    // Create a simple test text file to simulate a PDF
    const testContent = `
John Doe
Senior Software Engineer
Email: john@example.com | Phone: +45 12345678

EXPERIENCE
Senior Developer | TechCorp | 2020 - Present
- Led development of microservices
- Mentored junior developers

EDUCATION
Master of Science | Technical University | 2015 - 2017

SKILLS
JavaScript, Python, React, Node.js, AWS

LANGUAGES
English (Fluent), Danish (Native)
`;

    const blob = new Blob([testContent], { type: 'application/pdf' });
    const file = new File([blob], 'test-cv.pdf', { type: 'application/pdf' });
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/cv/parse', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      setTestResult({
        type: 'cv-upload',
        success: response.ok,
        status: response.status,
        data
      });
    } catch (error) {
      setTestResult({
        type: 'cv-upload',
        success: false,
        error: error instanceof Error ? error.message : 'Failed'
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔧 Quick Test & Debug Page
          </h1>
          <p className="text-gray-600">
            Test your CV parser, authentication, and database connection
          </p>
        </div>

        {/* Status Checks */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Database Status */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Database Status</h2>
            <button
              onClick={testDatabase}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-4"
            >
              Test Database Connection
            </button>
            {dbStatus && (
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-48">
                {JSON.stringify(dbStatus, null, 2)}
              </pre>
            )}
          </div>

          {/* Auth Status */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Authentication Status</h2>
            <button
              onClick={testAuth}
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 mb-4"
            >
              Check Auth Status
            </button>
            {authStatus && (
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-48">
                {JSON.stringify(authStatus, null, 2)}
              </pre>
            )}
          </div>
        </div>

        {/* Test Actions */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold mb-4">Test Actions</h2>
          
          <div className="space-y-4">
            {/* Test Signup */}
            <div>
              <button
                onClick={testSignup}
                disabled={loading}
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 font-semibold"
              >
                🧪 Test Signup (Create Test User)
              </button>
              <p className="text-sm text-gray-600 mt-2">
                Creates a random test user (test[timestamp]@example.com)
              </p>
            </div>

            {/* Test CV Upload */}
            <div>
              <button
                onClick={testCVUpload}
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-semibold"
              >
                📄 Test CV Parser (No Auth Required)
              </button>
              <p className="text-sm text-gray-600 mt-2">
                Tests the GPT-4o Vision CV parser with sample data
              </p>
            </div>
          </div>
        </div>

        {/* Test Results */}
        {testResult && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">
              {testResult.success ? '✅ Test Result' : '❌ Test Failed'}
            </h2>
            <div className="mb-4">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                testResult.success 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {testResult.type?.toUpperCase()} - Status {testResult.status || 'N/A'}
              </span>
            </div>
            
            {testResult.email && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="font-semibold">Test Account Created:</p>
                <p className="text-sm">Email: <code className="bg-white px-2 py-1 rounded">{testResult.email}</code></p>
                <p className="text-sm">Password: <code className="bg-white px-2 py-1 rounded">testpassword123</code></p>
              </div>
            )}

            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}

        {/* Quick Links */}
        <div className="bg-white rounded-xl shadow-lg p-8 mt-6">
          <h2 className="text-2xl font-bold mb-4">Quick Links</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link 
              href="/signup"
              className="block text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:shadow-lg transition"
            >
              Create Account
            </Link>
            <Link 
              href="/login"
              className="block text-center bg-gray-800 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition"
            >
              Login
            </Link>
            <Link 
              href="/upload"
              className="block text-center bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition"
            >
              Upload CV
            </Link>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
          <h3 className="font-bold text-blue-900 mb-2">💡 How to Use This Page</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
            <li><strong>Test Database:</strong> Verify your Prisma/PostgreSQL connection</li>
            <li><strong>Check Auth:</strong> See if you're currently logged in</li>
            <li><strong>Test Signup:</strong> Create a test user to verify signup works</li>
            <li><strong>Test CV Parser:</strong> Verify GPT-4o Vision is working</li>
          </ol>
        </div>

        {/* Common Issues */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mt-6">
          <h3 className="font-bold text-yellow-900 mb-2">⚠️ Common Issues</h3>
          <ul className="list-disc list-inside space-y-2 text-yellow-800 text-sm">
            <li><strong>Database error:</strong> Run <code className="bg-white px-2 py-1 rounded">npx prisma migrate dev</code></li>
            <li><strong>OPENAI_API_KEY error:</strong> Add it to your .env.local file</li>
            <li><strong>Signup fails:</strong> Check console logs and database connection</li>
            <li><strong>CV parser fails:</strong> Verify OpenAI API key has GPT-4o access</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
