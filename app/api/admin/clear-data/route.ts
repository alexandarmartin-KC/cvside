import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Security: Only allow the authenticated user to clear their own data
    const userId = session.user.id;
    console.log('Clearing data for user:', userId, session.user.email);

    // Delete user's data in order to respect foreign key constraints
    const results = {
      seenJobs: 0,
      appliedJobs: 0,
      savedJobs: 0,
      jobMatches: 0,
      cvProfile: 0,
    };

    console.log('Deleting SeenJobs...');
    const seenJobs = await prisma.seenJob.deleteMany({ where: { userId } });
    results.seenJobs = seenJobs.count;
    console.log(`Deleted ${seenJobs.count} SeenJobs`);

    console.log('Deleting AppliedJobs...');
    const appliedJobs = await prisma.appliedJob.deleteMany({ where: { userId } });
    results.appliedJobs = appliedJobs.count;
    console.log(`Deleted ${appliedJobs.count} AppliedJobs`);

    console.log('Deleting SavedJobs...');
    const savedJobs = await prisma.savedJob.deleteMany({ where: { userId } });
    results.savedJobs = savedJobs.count;
    console.log(`Deleted ${savedJobs.count} SavedJobs`);

    console.log('Deleting JobMatches...');
    const jobMatches = await prisma.jobMatch.deleteMany({ where: { userId } });
    results.jobMatches = jobMatches.count;
    console.log(`Deleted ${jobMatches.count} JobMatches`);

    console.log('Deleting CvProfile...');
    const cvProfile = await prisma.cvProfile.deleteMany({ where: { userId } });
    results.cvProfile = cvProfile.count;
    console.log(`Deleted ${cvProfile.count} CvProfile`);

    console.log('✅ All user data cleared successfully!');

    return NextResponse.json({ 
      success: true, 
      message: 'All your data has been cleared',
      results 
    });
  } catch (error) {
    console.error('Error clearing data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
