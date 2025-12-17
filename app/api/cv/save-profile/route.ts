import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-session';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    
    // If not logged in, just return success without saving
    if (!user) {
      return NextResponse.json({ success: true, saved: false });
    }

    const body = await req.json();
    const { 
      name, 
      title, 
      seniority, 
      summary, 
      skills, 
      locations, 
      preferredLocation,
      cvFileName 
    } = body;

    // Validate input
    if (!Array.isArray(skills) || !Array.isArray(locations)) {
      return NextResponse.json(
        { error: 'Skills and locations must be arrays' },
        { status: 400 }
      );
    }

    // Upsert CV profile with all extracted data
    await prisma.cvProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        name,
        title,
        seniority,
        summary,
        skills,
        locations,
        preferredLocation: preferredLocation || (locations.length > 0 ? locations[0] : null),
        cvFileName,
        cvUploadedAt: new Date(),
        workPreference: 'ANY', // Default
      },
      update: {
        name,
        title,
        seniority,
        summary,
        skills,
        locations,
        preferredLocation: preferredLocation || (locations.length > 0 ? locations[0] : null),
        cvFileName,
        cvUploadedAt: new Date(),
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
