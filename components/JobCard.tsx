import Link from 'next/link';

type JobCardProps = {
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    remote: boolean;
    skills: string[];
  };
  score?: number;
  reasons?: string[];
  isNew?: boolean;
  isSaved?: boolean;
  appliedAt?: Date | null;
  actions?: React.ReactNode;
  showTailorButton?: boolean;
};

export function JobCard({ job, score, reasons, isNew, isSaved, appliedAt, actions, showTailorButton = true }: JobCardProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('da-DK', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all p-6">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 text-lg">{job.title}</h3>
            {isNew && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                New
              </span>
            )}
            {/* Removed Saved badge as requested */}
            {appliedAt && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-green-300 bg-white/80 px-2 py-0.5 text-xs font-medium text-green-700 ml-1">
                <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Applied
              </span>
            )}
          </div>
          <p className="text-gray-600 text-sm mb-2">{job.company}</p>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="flex items-center gap-1 text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {job.location}
            </span>
            {job.remote && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                Remote
              </span>
            )}
          </div>
        </div>
        {score !== undefined && (
          <div className="flex-shrink-0">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{score}%</div>
              <div className="text-xs text-gray-500">Match</div>
            </div>
          </div>
        )}
      </div>

      {/* Skills */}
      {job.skills && job.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {job.skills.slice(0, 6).map((skill) => (
            <span
              key={skill}
              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
            >
              {skill}
            </span>
          ))}
          {job.skills.length > 6 && (
            <span className="px-2 py-1 text-gray-500 text-xs">
              +{job.skills.length - 6} more
            </span>
          )}
        </div>
      )}

      {/* Reasons */}
      {reasons && reasons.length > 0 && (
        <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="text-sm font-medium text-green-900">Why it matches:</div>
            <div className="flex items-center gap-2">
              {appliedAt && (
                <div className="inline-flex items-center gap-1.5 rounded-full border border-green-300 bg-white/80 px-3 py-1 text-xs font-medium text-green-700 shrink-0">
                  <svg className="w-3.5 h-3.5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Applied · {formatDate(appliedAt)}
                </div>
              )}
            </div>
          </div>
          <ul className="space-y-1">
            {reasons.slice(0, 3).map((reason, idx) => (
              <li key={idx} className="text-sm text-green-800 flex items-start gap-2">
                <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
        {showTailorButton && (
          <Link
            href={`/dashboard/tailor/${job.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Tailor CV
          </Link>
        )}
        {actions}
      </div>
    </div>
  );
}
