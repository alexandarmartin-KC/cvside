import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-session';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    
    console.log('Save profile - User:', user ? user.id : 'Not logged in');
    
    // If not logged in, just return success without saving
    if (!user) {
      console.log('Save profile - User not logged in, skipping save');
      return NextResponse.json({ success: true, saved: false });
    }

    const body = await req.json();
    console.log('Save profile - Body received:', Object.keys(body));
    
    const { 
      name, 
      title, 
      seniority, 
      summary, 
      skills, 
      locations, 
      preferredLocation,
      cvFileName,
      cvUrl,
      workPreference,
      rawCvText,
      experience,
      education
    } = body;

    // Validate input
    if (!Array.isArray(skills) || !Array.isArray(locations)) {
      console.log('Save profile - Invalid data types');
      return NextResponse.json(
        { error: 'Skills and locations must be arrays' },
        { status: 400 }
      );
    }

    // Convert experience and education arrays to JSON strings for storage
    const experienceJson = experience ? JSON.stringify(experience) : null;
    const educationJson = education ? JSON.stringify(education) : null;

    console.log('Save profile - Upserting for user:', user.id);
    console.log('Save profile - Experience entries:', experience?.length || 0);
    console.log('Save profile - Education entries:', education?.length || 0);

    // Base data for upsert (without new columns that may not exist yet)
    const baseCreateData = {
      userId: user.id,
      name,
      title,
      seniority,
      summary,
      skills,
      locations,
      preferredLocation: preferredLocation || (locations.length > 0 ? locations[0] : null),
      cvFileName: cvFileName || null,
      cvUrl: cvUrl || null,
      cvUploadedAt: cvFileName ? new Date() : null,
      workPreference: workPreference || 'ANY',
      rawCvText: rawCvText || null,
    };

    const baseUpdateData = {
      name,
      title,
      seniority,
      summary,
      skills,
      locations,
      preferredLocation: preferredLocation || (locations.length > 0 ? locations[0] : null),
      workPreference: workPreference || 'ANY',
      ...(cvFileName && {
        cvFileName,
        cvUrl: cvUrl || null,
        cvUploadedAt: new Date(),
      }),
      ...(rawCvText !== undefined && {
        rawCvText: rawCvText || null,
      }),
      updatedAt: new Date(),
    };

    let result;
    
    // Try to save with new columns first
    try {
      result = await prisma.cvProfile.upsert({
        where: { userId: user.id },
        create: {
          ...baseCreateData,
          experienceJson,
          educationJson,
        },
        update: {
          ...baseUpdateData,
          ...(experienceJson !== undefined && { experienceJson }),
          ...(educationJson !== undefined && { educationJson }),
        },
      });
      console.log('Save profile - Successfully saved CV profile with experience/education:', result.id);
    } catch (innerError: any) {
      // If it fails due to missing columns, fall back to save without them
      if (innerError?.message?.includes('experienceJson') || innerError?.message?.includes('educationJson') ||
          innerError?.code === 'P2009' || innerError?.code === 'P2022') {
        console.warn('Save profile - experienceJson/educationJson columns not available, saving without them');
        result = await prisma.cvProfile.upsert({
          where: { userId: user.id },
          create: baseCreateData,
          update: baseUpdateData,
        });
        console.log('Save profile - Successfully saved CV profile (without experience/education):', result.id);
      } else {
        throw innerError; // Re-throw if it's a different error
      }
    }

    return NextResponse.json({ success: true, saved: true });
  } catch (error) {
    console.error('Error saving CV profile:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Detailed error:', errorMessage);
    if (error instanceof Error && error.stack) {
      console.error('Stack:', error.stack);
    }
    return NextResponse.json(
      { error: 'Failed to save CV profile', details: errorMessage },
      { status: 500 }
    );
  }
}
