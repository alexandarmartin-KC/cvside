import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await req.json();
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
    }

    // Delete the AppliedJob record
    await prisma.appliedJob.deleteMany({
      where: {
        userId: session.user.id,
        jobId: jobId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unmarking job as applied:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
