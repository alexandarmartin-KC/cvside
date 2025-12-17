'use client';

import { useState, useEffect } from 'react';

export default function UploadPage() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check-session');
        const data = await response.json();
        setIsLoggedIn(data.authenticated);
      } catch (error) {
        console.error('Auth check error:', error);
        setIsLoggedIn(false);
      }
    };
    checkAuth();
  }, []);

  if (isLoggedIn === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in</h1>
          <a href="/login" className="text-blue-600 hover:text-blue-700">
            Go to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload</h1>
          <p className="text-gray-600">Upload page - ready for features</p>
        </div>
      </div>
    </div>
  );
}
