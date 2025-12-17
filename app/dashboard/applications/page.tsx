import { requireUser } from '@/lib/auth-session';

export default async function ApplicationsPage() {
  const user = await requireUser();

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Applications</h1>
        <p className="text-gray-600">Track your job applications here.</p>
      </div>
    </div>
  );
}
