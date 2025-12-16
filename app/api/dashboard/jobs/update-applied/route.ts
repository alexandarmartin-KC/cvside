import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import type { AppliedJobStatus } from '@prisma/client';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { appliedJobId, status, notes } = await req.json();

  try {
    const updateData: any = {
      status: status as AppliedJobStatus,
      notes,
      updatedAt: new Date(),
    };

    // Set appliedAt when moving to APPLIED status
    if (status === 'APPLIED') {
      const existing = await prisma.appliedJob.findUnique({
        where: { id: appliedJobId },
      });
      if (existing && !existing.appliedAt) {
        updateData.appliedAt = new Date();
      }
    }

    await prisma.appliedJob.update({
      where: {
        id: appliedJobId,
        userId: session.user.id,
      },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating applied job:', error);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}
