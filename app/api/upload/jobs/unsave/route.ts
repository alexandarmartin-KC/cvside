import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { job } = await req.json();

  try {
    const jobId = `mock-${job.id}`;
    
    // Delete the saved job
    await prisma.savedJob.deleteMany({
      where: {
        userId: session.user.id,
        jobId: jobId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unsaving job:', error);
    return NextResponse.json({ error: 'Failed to unsave job' }, { status: 500 });
  }
}
