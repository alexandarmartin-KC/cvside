import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-session';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    
    // Fetch the user's CV profile
    const cvProfile = await prisma.cvProfile.findUnique({
      where: { userId: user.id }
    });

    if (!cvProfile) {
      return NextResponse.json(
        { error: 'No CV profile found' },
        { status: 404 }
      );
    }

    // Transform to the format expected by CVVerificationWizard
    const transformedProfile = {
      name: cvProfile.name,
      name_confidence: 'high',
      title: cvProfile.title,
      summary: cvProfile.summary,
      contact: {
        email: user.email,
        phone: null,
        location: cvProfile.preferredLocation,
        linkedin: null
      },
      skills: cvProfile.skills || [],
      languages: [], // TODO: Add languages field to schema
      experience: [], // TODO: Add experience model/table
      education: [] // TODO: Add education model/table
    };

    return NextResponse.json(transformedProfile);
  } catch (error) {
    console.error('Error fetching CV profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CV profile' },
      { status: 500 }
    );
  }
}
