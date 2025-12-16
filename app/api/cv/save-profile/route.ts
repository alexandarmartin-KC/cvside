import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    // If not logged in, just return success without saving
    if (!session) {
      return NextResponse.json({ success: true, saved: false });
    }

    const body = await req.json();
    const { skills, locations, preferredLocation } = body;

    // Validate input
    if (!Array.isArray(skills) || !Array.isArray(locations)) {
      return NextResponse.json(
        { error: 'Skills and locations must be arrays' },
        { status: 400 }
      );
    }

    // Upsert CV profile
    await prisma.cvProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        skills,
        locations,
        preferredLocation: preferredLocation || (locations.length > 0 ? locations[0] : null),
      },
      update: {
        skills,
        locations,
        preferredLocation: preferredLocation || (locations.length > 0 ? locations[0] : null),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, saved: true });
  } catch (error) {
    console.error('Error saving CV profile:', error);
    return NextResponse.json(
      { error: 'Failed to save CV profile' },
      { status: 500 }
    );
  }
}
