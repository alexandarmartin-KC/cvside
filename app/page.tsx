import Link from 'next/link';
import { articles } from '@/lib/articles';
import { auth } from '@/lib/auth';

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Top Bar with Login/Dashboard */}
        <div className="flex justify-end mb-8">
          {session?.user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center px-6 py-2.5 bg-white border-2 border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-all"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Go to Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center px-6 py-2.5 bg-white border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Login
            </Link>
          )}
        </div>

        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            CV Matcher
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Upload your CV and get AI-powered job matches in seconds
          </p>
          <a
            href="/upload"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-800 transform hover:-translate-y-0.5 transition-all"
          >
            Get Started
            <svg
              className="ml-2 w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </a>
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Upload Your CV</h3>
              <p className="text-gray-600 text-sm">Simply drag & drop your PDF resume or click to browse</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">2. AI Analysis</h3>
              <p className="text-gray-600 text-sm">Our AI extracts your skills, experience, and qualifications</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">3. Get Matched</h3>
              <p className="text-gray-600 text-sm">See ranked job matches with scores and detailed reasoning</p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <p className="text-lg font-semibold text-green-600">
              ✨ Completely Free • No Sign-Up Required • Instant Results
            </p>
          </div>
        </div>

        {/* Problem/Solution Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 md:p-12 text-white mb-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Stop Wasting Hours Searching Multiple Job Sites
            </h2>
            <p className="text-lg text-blue-50 mb-6 leading-relaxed">
              Tired of opening dozens of tabs? Switching between LinkedIn, Indeed, Glassdoor, and countless company websites just to find jobs that might fit your profile? We've all been there.
            </p>
            <p className="text-xl font-semibold mb-6">
              CV Matcher brings all job opportunities to one place.
            </p>
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-red-300 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <div className="ml-4">
                    <h3 className="font-semibold text-white mb-2">The Old Way</h3>
                    <ul className="text-blue-50 text-sm space-y-2">
                      <li>• Visit 10+ job sites separately</li>
                      <li>• Manually read each job description</li>
                      <li>• Guess if you're a good match</li>
                      <li>• Miss opportunities across platforms</li>
                      <li>• Spend hours comparing roles</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-green-300 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <div className="ml-4">
                    <h3 className="font-semibold text-white mb-2">With CV Matcher</h3>
                    <ul className="text-blue-50 text-sm space-y-2">
                      <li>• Upload CV once, get all matches</li>
                      <li>• AI analyzes fit automatically</li>
                      <li>• See ranked results with scores</li>
                      <li>• Aggregates LinkedIn, Indeed & more</li>
                      <li>• Get results in under 30 seconds</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8">
              <p className="text-lg text-blue-50">
                <span className="font-semibold">We scan opportunities from LinkedIn, Indeed, Glassdoor, ZipRecruiter, and dozens of company career pages</span> — all in one search, ranked by how well they match your unique profile.
              </p>
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            What People Say
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  SM
                </div>
                <div className="ml-3">
                  <h4 className="font-semibold text-gray-900">Sarah Mitchell</h4>
                  <p className="text-sm text-gray-600">Software Engineer</p>
                </div>
              </div>
              <div className="flex mb-3">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                "This tool saved me hours! Got instant feedback on which jobs I'm best suited for. The AI analysis was spot-on."
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  JC
                </div>
                <div className="ml-3">
                  <h4 className="font-semibold text-gray-900">James Chen</h4>
                  <p className="text-sm text-gray-600">Product Manager</p>
                </div>
              </div>
              <div className="flex mb-3">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                "Clean interface, fast results, and completely free! Helped me understand my CV's strengths and find better job matches."
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                  AP
                </div>
                <div className="ml-3">
                  <h4 className="font-semibold text-gray-900">Aisha Patel</h4>
                  <p className="text-sm text-gray-600">Data Analyst</p>
                </div>
              </div>
              <div className="flex mb-3">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                "Love how it ranks jobs by match percentage. Made my job search so much more focused and efficient. Highly recommend!"
              </p>
            </div>
          </div>
        </div>

        {/* Articles Section - Job Search Insights */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
            Job Search Insights
          </h2>
          <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
            Practical advice to improve your CV, understand what recruiters look for, and get more interviews
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/articles/${article.slug}`}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all group"
              >
                <div className="flex flex-col h-full">
                  <h3 className="font-semibold text-gray-900 mb-3 leading-snug group-hover:text-blue-600 transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4 flex-grow line-clamp-2 overflow-hidden" style={{ maxHeight: '2.5rem' }}>
                    {article.excerpt}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-xs text-gray-500">{article.readTime}</span>
                    <span className="text-sm text-blue-600 font-medium group-hover:text-blue-700 flex items-center">
                      Read article
                      <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
