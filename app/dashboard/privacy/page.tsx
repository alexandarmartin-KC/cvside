import { auth } from '@/lib/auth';
import { ExportDataButton, DeleteDataButton } from './client';

export default async function PrivacyPage() {
  const session = await auth();
  
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Privacy & Data</h1>
        <p className="text-gray-600 mt-1">Manage your personal data</p>
      </div>

      {/* What We Store */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">What Data We Store</h2>
        <ul className="space-y-3">
          <DataItem
            title="Profile Information"
            description="Your name, email, and CV details (skills, locations, preferences)"
          />
          <DataItem
            title="Job Data"
            description="Saved jobs, applied jobs with status and notes, job matches and scores"
          />
          <DataItem
            title="Activity"
            description="Timestamps for when you view or interact with jobs"
          />
          <DataItem
            title="Authentication"
            description="OAuth tokens from Google for secure login"
          />
        </ul>
      </div>

      {/* Privacy Principles */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">Our Privacy Principles</h2>
        <ul className="space-y-2">
          <li className="flex items-start gap-2 text-sm text-blue-800">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>We never sell or share your data with third parties</span>
          </li>
          <li className="flex items-start gap-2 text-sm text-blue-800">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Your CV is processed securely and not stored in plain text</span>
          </li>
          <li className="flex items-start gap-2 text-sm text-blue-800">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>You can export or delete your data at any time</span>
          </li>
          <li className="flex items-start gap-2 text-sm text-blue-800">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Data is encrypted in transit and at rest</span>
          </li>
        </ul>
      </div>

      {/* Export Data */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Export Your Data</h2>
        <p className="text-gray-600 text-sm mb-4">
          Download all your data in JSON format. This includes your profile, saved jobs, applications, and activity history.
        </p>
        <ExportDataButton />
      </div>

      {/* Delete Data */}
      <div className="bg-white rounded-lg border border-red-200 p-6">
        <h2 className="text-xl font-semibold text-red-900 mb-2">Delete Your Data</h2>
        <p className="text-gray-600 text-sm mb-4">
          Permanently delete all your data from our system. This action cannot be undone. Your account will be deleted and you'll be logged out.
        </p>
        <DeleteDataButton />
      </div>
    </div>
  );
}

function DataItem({ title, description }: { title: string; description: string }) {
  return (
    <li className="pb-3 border-b border-gray-100 last:border-0">
      <h3 className="font-medium text-gray-900 text-sm">{title}</h3>
      <p className="text-gray-600 text-sm mt-1">{description}</p>
    </li>
  );
}
