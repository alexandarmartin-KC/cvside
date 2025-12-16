import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { jobId, status } = await req.json();

  try {
    // Check if already applied
    const existing = await prisma.appliedJob.findUnique({
      where: {
        userId_jobId: {
          userId: session.user.id,
          jobId,
        },
      },
    });

    if (existing) {
      // Update existing AppliedJob
      await prisma.appliedJob.update({
        where: {
          userId_jobId: {
            userId: session.user.id,
            jobId,
          },
        },
        data: {
          status: status || 'APPLIED',
          appliedAt: status === 'APPLIED' && !existing.appliedAt ? new Date() : existing.appliedAt,
        },
      });
      return NextResponse.json({ success: true, message: 'Updated' });
    }

    // Create new AppliedJob
    await prisma.appliedJob.create({
      data: {
        userId: session.user.id,
        jobId,
        status: status || 'APPLIED',
        appliedAt: status === 'APPLIED' ? new Date() : null,
      },
    });

    // Note: We do NOT delete SavedJob - the job stays in both lists
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking job as applied:', error);
    return NextResponse.json({ error: 'Failed to mark job as applied' }, { status: 500 });
  }
}
