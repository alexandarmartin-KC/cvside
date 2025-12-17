import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ savedJobIds: [] });
    }

    const savedJobs = await prisma.savedJob.findMany({
      where: { userId: session.user.id },
      select: { jobId: true },
    });

    const savedJobIds = savedJobs.map(sj => sj.jobId);

    return NextResponse.json({ savedJobIds });
  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    return NextResponse.json({ savedJobIds: [] });
  }
}
