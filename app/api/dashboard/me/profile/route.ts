import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-session';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Fetching profile - getting session user...');
    const user = await getSessionUser();
    
    console.log('User from session:', user ? user.id : 'null');
    
    if (!user) {
      console.log('No user found in session');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    console.log('Fetching CV profile for user:', user.id);
    
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

    console.log('Profile found:', profile ? 'yes' : 'no');
    
    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Failed to fetch profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    if (error instanceof Error && error.stack) {
      console.error('Stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'Failed to fetch profile', details: errorMessage },
      { status: 500 }
    );
  }
}
