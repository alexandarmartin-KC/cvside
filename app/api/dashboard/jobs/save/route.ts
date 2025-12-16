import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { jobId } = await req.json();

  try {
    // Check if already saved
    const existing = await prisma.savedJob.findUnique({
      where: {
        userId_jobId: {
          userId: session.user.id,
          jobId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ message: 'Already saved' });
    }

    await prisma.savedJob.create({
      data: {
        userId: session.user.id,
        jobId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving job:', error);
    return NextResponse.json({ error: 'Failed to save job' }, { status: 500 });
  }
}
