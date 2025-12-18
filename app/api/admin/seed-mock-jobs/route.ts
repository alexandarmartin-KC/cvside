import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth-session';

export async function POST() {
  try {
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's CV profile
    const cvProfile = await prisma.cvProfile.findUnique({
      where: { userId: user.id },
    });

    if (!cvProfile) {
      return NextResponse.json(
        { error: 'Please create a CV profile first' },
        { status: 400 }
      );
    }

    console.log(`Creating mock jobs for user: ${user.email}`);

    // Extract skills from CV
    const userSkills = cvProfile.skills || ['JavaScript', 'TypeScript', 'React'];
    const userTitle = cvProfile.title || 'Software Engineer';
    const userLocation = cvProfile.preferredLocation || cvProfile.locations?.[0] || 'London';

    // Create mock jobs
    const mockJobs = [
      {
        title: `Senior ${userTitle}`,
        company: 'Tech Innovation Ltd',
        location: userLocation,
        remote: false,
        description: `We're looking for a skilled ${userTitle} to join our team. ${userSkills.slice(0, 3).join(', ')} experience required.`,
        skills: userSkills.slice(0, 5),
        source: 'Mock',
        sourceUrl: 'https://example.com/job1',
        score: 85,
        reasons: ['Strong skill match', 'Location match', 'Seniority level match'],
      },
      {
        title: `Lead ${userTitle}`,
        company: 'Digital Solutions Inc',
        location: userLocation,
        remote: true,
        description: `Remote opportunity for an experienced ${userTitle}. Must have expertise in ${userSkills[0]}.`,
        skills: userSkills.slice(0, 4),
        source: 'Mock',
        sourceUrl: 'https://example.com/job2',
        score: 78,
        reasons: ['Remote work available', 'Skill alignment', 'Senior position'],
      },
      {
        title: `${userTitle} - ${userSkills[0]} Specialist`,
        company: 'Global Systems Corp',
        location: 'Manchester',
        remote: false,
        description: `Join our growing team as a ${userTitle}. Experience with ${userSkills.slice(0, 2).join(' and ')} preferred.`,
        skills: userSkills.slice(0, 3),
        source: 'Mock',
        sourceUrl: 'https://example.com/job3',
        score: 72,
        reasons: ['Relevant skills', 'Growing company', 'Career progression'],
      },
      {
        title: 'Principal Engineer',
        company: 'StartUp Ventures',
        location: 'Remote',
        remote: true,
        description: `Fully remote position for a Principal Engineer with strong ${userSkills[1] || 'technical'} background.`,
        skills: [userSkills[0], userSkills[1], 'Leadership', 'Architecture'].filter(Boolean),
        source: 'Mock',
        sourceUrl: 'https://example.com/job4',
        score: 90,
        reasons: ['Excellent skill match', 'Remote flexibility', 'Leadership role'],
      },
      {
        title: `${userTitle} Team Lead`,
        company: 'Enterprise Solutions',
        location: 'Birmingham',
        remote: false,
        description: `Team lead position requiring ${userSkills[0]} expertise and management experience.`,
        skills: [userSkills[0], 'Team Management', 'Agile', userSkills[1]].filter(Boolean),
        source: 'Mock',
        sourceUrl: 'https://example.com/job5',
        score: 68,
        reasons: ['Leadership opportunity', 'Technical match'],
      },
      {
        title: `Senior ${userSkills[0]} Developer`,
        company: 'CloudTech Systems',
        location: userLocation,
        remote: true,
        description: `Hybrid role focusing on ${userSkills[0]}. Great benefits and work-life balance.`,
        skills: [userSkills[0], userSkills[2], 'Cloud', 'DevOps'].filter(Boolean),
        source: 'Mock',
        sourceUrl: 'https://example.com/job6',
        score: 82,
        reasons: ['Primary skill match', 'Hybrid working', 'Location match'],
      },
      {
        title: 'Engineering Manager',
        company: 'FinTech Innovations',
        location: 'London',
        remote: false,
        description: `Management role for experienced engineer with ${userSkills.slice(0, 2).join(' and ')} background.`,
        skills: ['Management', 'Leadership', userSkills[0], userSkills[1]].filter(Boolean),
        source: 'Mock',
        sourceUrl: 'https://example.com/job7',
        score: 65,
        reasons: ['Management track', 'FinTech sector'],
      },
      {
        title: `Contract ${userTitle}`,
        company: 'Consultancy Partners',
        location: 'Remote',
        remote: true,
        description: `6-month contract for ${userTitle} with ${userSkills[0]} expertise.`,
        skills: userSkills.slice(0, 4),
        source: 'Mock',
        sourceUrl: 'https://example.com/job8',
        score: 75,
        reasons: ['Contract opportunity', 'Skill match', 'Fully remote'],
      },
    ];

    let created = 0;
    let matched = 0;

    for (const mockJob of mockJobs) {
      const { score, reasons, ...jobData } = mockJob;

      // Create job
      const job = await prisma.job.create({
        data: jobData,
      });
      created++;

      // Create job match
      await prisma.jobMatch.create({
        data: {
          userId: user.id,
          jobId: job.id,
          score,
          reasons,
        },
      });
      matched++;

      console.log(`✓ Created: ${job.title} at ${job.company} (Score: ${score})`);
    }

    return NextResponse.json({
      success: true,
      message: `Created ${created} jobs and ${matched} job matches`,
      jobs: created,
      matches: matched,
    });
  } catch (error) {
    console.error('Error seeding mock data:', error);
    return NextResponse.json(
      { error: 'Failed to create mock data' },
      { status: 500 }
    );
  }
}
