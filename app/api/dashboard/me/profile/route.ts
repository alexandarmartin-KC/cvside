import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch user's CV profile
    const profile = await prisma.cvProfile.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        title: true,
        seniority: true,
        summary: true,
        skills: true,
        locations: true,
        preferredLocation: true,
        cvFileName: true,
        cvUploadedAt: true,
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}
