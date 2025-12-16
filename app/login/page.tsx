import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LoginButton from './LoginButton';

export default async function LoginPage() {
  let session = null;
  try {
    session = await auth();
    if (session?.user) {
      redirect('/dashboard');
    }
  } catch (error) {
    console.error('Auth check failed on login page:', error);
    // Continue to show login page
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
            <p className="text-gray-600">Sign in to access your job dashboard</p>
          </div>

          {/* Google Sign In */}
          <LoginButton />

          {/* Divider */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <Link
              href="/"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to home
            </Link>
          </div>

          {/* Features */}
          <div className="mt-6 space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-600">Save and track job applications</span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-600">Get personalized job matches</span>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-600">Manage your CV and preferences</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
