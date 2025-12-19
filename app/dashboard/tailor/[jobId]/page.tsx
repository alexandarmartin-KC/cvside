import { requireUser } from '@/lib/auth-session';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { TailorClient } from './client';

export const dynamic = 'force-dynamic';

export default async function TailorCVPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const user = await requireUser();
  const { jobId } = await params;

  // Fetch job details
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    notFound();
  }

  // Fetch user's CV profile
  const cvProfile = await prisma.cvProfile.findUnique({
    where: { userId: user.id },
  });

  if (!cvProfile) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No CV Profile Found</h2>
          <p className="text-gray-600 mb-4">Please upload your CV before tailoring it for jobs.</p>
          <a
            href="/upload"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Upload CV
          </a>
        </div>
      </div>
    );
  }

  return <TailorClient job={job} />;
}
