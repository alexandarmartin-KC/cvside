import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // Check if database is configured
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ 
        error: 'Database not configured',
        details: 'DATABASE_URL environment variable is not set on Vercel'
      }, { status: 503 });
    }

    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { job, match } = await req.json();

    if (!job?.id) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
    }

    // Ensure user exists in database (for test accounts)
    let dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!dbUser && session.user.email) {
      // Create user if doesn't exist (test accounts)
      dbUser = await prisma.user.create({
        data: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name || session.user.email.split('@')[0],
        },
      });
    }

    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Failed to save job', 
      details: errorMessage,
      type: error instanceof Error ? error.constructor.name : typeof error
    }, { status: 500 });
  }
}
