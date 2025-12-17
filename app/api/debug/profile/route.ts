import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;
    
    const profile = await prisma.cvProfile.findUnique({
      where: { userId },
      select: {
        name: true,
        title: true,
        seniority: true,
        summary: true,
        skills: true,
        locations: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    const matchCount = await prisma.jobMatch.count({ where: { userId } });
    const savedCount = await prisma.savedJob.count({ where: { userId } });
    const appliedCount = await prisma.appliedJob.count({ where: { userId } });

    return NextResponse.json({
      userId,
      hasProfile: !!profile,
      profile,
      counts: {
        matches: matchCount,
        saved: savedCount,
        applied: appliedCount,
      }
    });
  } catch (error) {
    console.error('Debug profile error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
