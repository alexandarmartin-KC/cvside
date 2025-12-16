import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [user, cvProfile, jobMatches, savedJobs, appliedJobs, seenJobs] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      }),
      prisma.cvProfile.findUnique({
        where: { userId: session.user.id },
      }),
      prisma.jobMatch.findMany({
        where: { userId: session.user.id },
        include: { job: true },
      }),
      prisma.savedJob.findMany({
        where: { userId: session.user.id },
        include: { job: true },
      }),
      prisma.appliedJob.findMany({
        where: { userId: session.user.id },
        include: { job: true },
      }),
      prisma.seenJob.findMany({
        where: { userId: session.user.id },
      }),
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      user,
      cvProfile,
      jobMatches,
      savedJobs,
      appliedJobs,
      seenJobs,
    };

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
