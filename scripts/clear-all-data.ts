import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAllData() {
  console.log('Starting to clear all application data...');

  try {
    // Delete in order to respect foreign key constraints
    console.log('Deleting SeenJobs...');
    const seenJobs = await prisma.seenJob.deleteMany({});
    console.log(`Deleted ${seenJobs.count} SeenJobs`);

    console.log('Deleting AppliedJobs...');
    const appliedJobs = await prisma.appliedJob.deleteMany({});
    console.log(`Deleted ${appliedJobs.count} AppliedJobs`);

    console.log('Deleting SavedJobs...');
    const savedJobs = await prisma.savedJob.deleteMany({});
    console.log(`Deleted ${savedJobs.count} SavedJobs`);

    console.log('Deleting JobMatches...');
    const jobMatches = await prisma.jobMatch.deleteMany({});
    console.log(`Deleted ${jobMatches.count} JobMatches`);

    console.log('Deleting Jobs...');
    const jobs = await prisma.job.deleteMany({});
    console.log(`Deleted ${jobs.count} Jobs`);

    console.log('Deleting CvProfiles...');
    const cvProfiles = await prisma.cvProfile.deleteMany({});
    console.log(`Deleted ${cvProfiles.count} CvProfiles`);

    console.log('✅ All application data cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearAllData();
