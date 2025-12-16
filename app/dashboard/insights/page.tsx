import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function InsightsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [totalMatches, totalSaved, totalApplied, appliedByWeek, topLocations, responseRate] =
    await Promise.all([
      prisma.jobMatch.count({ where: { userId } }),
      prisma.savedJob.count({ where: { userId } }),
      prisma.appliedJob.count({ where: { userId } }),
      getApplicationsByWeek(userId),
      getTopLocations(userId),
      getResponseRate(userId),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Insights</h1>
        <p className="text-gray-600 mt-1">Analytics for your job search</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Matches" value={totalMatches} />
        <StatCard title="Saved Jobs" value={totalSaved} />
        <StatCard title="Applications" value={totalApplied} />
      </div>

      {/* Applications per Week */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Applications by Week</h2>
        {appliedByWeek.length > 0 ? (
          <div className="space-y-3">
            {appliedByWeek.map((week, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{week.week}</span>
                <div className="flex items-center gap-3">
                  <div className="w-48 h-6 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{
                        width: `${(week.count / Math.max(...appliedByWeek.map((w) => w.count))) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-8 text-right">
                    {week.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No applications yet</p>
        )}
      </div>

      {/* Top Locations */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Matching Locations</h2>
        {topLocations.length > 0 ? (
          <div className="space-y-2">
            {topLocations.map((loc, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-700">{loc.location}</span>
                <span className="text-sm font-semibold text-blue-600">{loc.count} jobs</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No location data yet</p>
        )}
      </div>

      {/* Response Rate */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Response Rate</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-2xl font-bold text-blue-600">{responseRate.applied}</p>
            <p className="text-xs text-gray-600">Applied</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">{responseRate.interview}</p>
            <p className="text-xs text-gray-600">Interviews</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{responseRate.offer}</p>
            <p className="text-xs text-gray-600">Offers</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">
              {responseRate.applied > 0
                ? Math.round((responseRate.interview / responseRate.applied) * 100)
                : 0}
              %
            </p>
            <p className="text-xs text-gray-600">Interview Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

async function getApplicationsByWeek(userId: string) {
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

  const applications = await prisma.appliedJob.findMany({
    where: {
      userId,
      appliedAt: {
        gte: fourWeeksAgo,
      },
    },
    select: {
      appliedAt: true,
    },
  });

  const weekCounts: Record<string, number> = {};
  applications.forEach((app) => {
    if (app.appliedAt) {
      const weekStart = new Date(app.appliedAt);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];
      weekCounts[weekKey] = (weekCounts[weekKey] || 0) + 1;
    }
  });

  return Object.entries(weekCounts)
    .map(([week, count]) => ({
      week: new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count,
    }))
    .slice(-4);
}

async function getTopLocations(userId: string) {
  const matches = await prisma.jobMatch.findMany({
    where: { userId },
    include: {
      job: {
        select: {
          location: true,
        },
      },
    },
    take: 100,
  });

  const locationCounts: Record<string, number> = {};
  matches.forEach((match) => {
    const loc = match.job.location;
    locationCounts[loc] = (locationCounts[loc] || 0) + 1;
  });

  return Object.entries(locationCounts)
    .map(([location, count]) => ({ location, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

async function getResponseRate(userId: string) {
  const [applied, interview, offer] = await Promise.all([
    prisma.appliedJob.count({
      where: {
        userId,
        status: 'APPLIED',
      },
    }),
    prisma.appliedJob.count({
      where: {
        userId,
        status: 'INTERVIEW',
      },
    }),
    prisma.appliedJob.count({
      where: {
        userId,
        status: 'OFFER',
      },
    }),
  ]);

  return { applied, interview, offer };
}
