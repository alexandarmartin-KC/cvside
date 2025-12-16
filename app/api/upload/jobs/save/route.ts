import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { job, match } = await req.json();

  try {
    // Create or find the job in the database
    const dbJob = await prisma.job.upsert({
      where: { 
        id: `mock-${job.id}` // Use a predictable ID for mock jobs
      },
      update: {
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        skills: job.skills,
        remote: job.location.toLowerCase().includes('remote'),
      },
      create: {
        id: `mock-${job.id}`,
        source: 'Mock',
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description,
        skills: job.skills,
        remote: job.location.toLowerCase().includes('remote'),
      },
    });

    // Create job match if provided
    if (match) {
      await prisma.jobMatch.upsert({
        where: {
          userId_jobId: {
            userId: session.user.id,
            jobId: dbJob.id,
          },
        },
        update: {
          score: match.score,
          reasons: match.reasons,
        },
        create: {
          userId: session.user.id,
          jobId: dbJob.id,
          score: match.score,
          reasons: match.reasons,
        },
      });
    }

    // Check if already saved
    const existing = await prisma.savedJob.findUnique({
      where: {
        userId_jobId: {
          userId: session.user.id,
          jobId: dbJob.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ success: true, message: 'Already saved' });
    }

    // Create saved job
    await prisma.savedJob.create({
      data: {
        userId: session.user.id,
        jobId: dbJob.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving job:', error);
    return NextResponse.json({ error: 'Failed to save job' }, { status: 500 });
  }
}
