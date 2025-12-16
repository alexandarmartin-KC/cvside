import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// MVP: Generate mock jobs and compute matches based on user's CV profile
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const cvProfile = await prisma.cvProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!cvProfile) {
      return NextResponse.json({ error: 'No CV profile found' }, { status: 400 });
    }

    // Get or create mock jobs
    let jobs = await prisma.job.findMany({
      take: 20,
    });

    if (jobs.length === 0) {
      // Seed some mock jobs
      jobs = await seedMockJobs();
    }

    // Calculate matches
    const userSkills = (cvProfile.skills || []).map((s) => s.toLowerCase());
    const userLocations = (cvProfile.locations || []).map((l) => l.toLowerCase());

    for (const job of jobs) {
      const jobSkills = (job.skills || []).map((s) => s.toLowerCase());
      const jobLocation = job.location.toLowerCase();

      // Calculate score
      let score = 60; // Base score

      // Skill overlap
      const skillOverlap = jobSkills.filter((s) => userSkills.includes(s)).length;
      score += skillOverlap * 8;

      // Location match
      if (userLocations.some((loc) => jobLocation.includes(loc) || loc.includes(jobLocation))) {
        score += 15;
      }

      // Preferred location boost
      if (
        cvProfile.preferredLocation &&
        jobLocation.includes(cvProfile.preferredLocation.toLowerCase())
      ) {
        score += 10;
      }

      // Remote boost if in user locations
      if (job.remote && userLocations.includes('remote')) {
        score += 10;
      }

      score = Math.min(100, score);

      // Generate reasons
      const reasons: string[] = [];
      if (skillOverlap > 0) {
        reasons.push(`${skillOverlap} matching skill${skillOverlap > 1 ? 's' : ''}`);
      }
      if (userLocations.some((loc) => jobLocation.includes(loc))) {
        reasons.push('Location matches your preferences');
      }
      if (job.remote) {
        reasons.push('Remote work available');
      }
      if (cvProfile.seniority && job.title.toLowerCase().includes(cvProfile.seniority.toLowerCase())) {
        reasons.push('Seniority level matches');
      }

      if (reasons.length === 0) {
        reasons.push('General match based on your profile');
      }

      // Create or update match
      await prisma.jobMatch.upsert({
        where: {
          userId_jobId: {
            userId: session.user.id,
            jobId: job.id,
          },
        },
        update: {
          score,
          reasons,
        },
        create: {
          userId: session.user.id,
          jobId: job.id,
          score,
          reasons,
        },
      });
    }

    return NextResponse.json({ success: true, matchCount: jobs.length });
  } catch (error) {
    console.error('Error refreshing jobs:', error);
    return NextResponse.json({ error: 'Failed to refresh jobs' }, { status: 500 });
  }
}

async function seedMockJobs() {
  const mockJobs = [
    {
      source: 'Mock',
      title: 'Senior Software Engineer',
      company: 'Tech Corp',
      location: 'London, UK',
      remote: true,
      description: 'Build scalable systems',
      skills: ['React', 'TypeScript', 'Node.js', 'AWS'],
    },
    {
      source: 'Mock',
      title: 'Full Stack Developer',
      company: 'StartupCo',
      location: 'San Francisco, CA',
      remote: false,
      description: 'Join our growing team',
      skills: ['JavaScript', 'Python', 'Docker', 'PostgreSQL'],
    },
    {
      source: 'Mock',
      title: 'Frontend Developer',
      company: 'Design Studio',
      location: 'Remote',
      remote: true,
      description: 'Create beautiful interfaces',
      skills: ['React', 'CSS', 'Figma', 'TypeScript'],
    },
    {
      source: 'Mock',
      title: 'Backend Engineer',
      company: 'DataTech',
      location: 'New York, NY',
      remote: true,
      description: 'Work with large scale data',
      skills: ['Python', 'PostgreSQL', 'Redis', 'Kubernetes'],
    },
    {
      source: 'Mock',
      title: 'DevOps Engineer',
      company: 'Cloud Services',
      location: 'Austin, TX',
      remote: true,
      description: 'Manage cloud infrastructure',
      skills: ['AWS', 'Terraform', 'Docker', 'Kubernetes'],
    },
  ];

  const created = [];
  for (const job of mockJobs) {
    const createdJob = await prisma.job.create({
      data: job,
    });
    created.push(createdJob);
  }

  return created;
}
