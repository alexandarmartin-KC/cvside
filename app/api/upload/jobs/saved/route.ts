import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const savedJobs = await prisma.savedJob.findMany({
      where: { userId: session.user.id },
      select: { jobId: true },
    });

    const savedJobIds = savedJobs.map(sj => sj.jobId);

    return NextResponse.json({ savedJobIds });
  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    return NextResponse.json({ error: 'Failed to fetch saved jobs' }, { status: 500 });
  }
}
