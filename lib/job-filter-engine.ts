/**
 * Deterministic Job Matching and Filtering Engine
 */

type Job = {
  job_id: string;
  title: string;
  company: string | null;
  location: string | null;
  score: number | null;
  posted_at: string | null;
};

type FilterInput = {
  location?: string | null;
  minimum_score?: string | number | null;
  sort_by?: string | null;
};

type FilterOutput = {
  filtered_jobs: Job[];
  applied_filters: {
    location: string | null;
    minimum_score: "Any" | 50 | 60 | 70 | 80;
    sort_by: "Best Match" | "Newest" | "Oldest" | "Company A–Z";
  };
};

/**
 * Normalize and validate filter inputs
 */
function normalizeFilters(input: FilterInput) {
  // Normalize location
  let location: string | null = null;
  if (input.location && typeof input.location === 'string' && input.location.trim()) {
    location = input.location.trim();
  }

  // Normalize minimum_score
  let minimum_score: "Any" | 50 | 60 | 70 | 80 = "Any";
  if (input.minimum_score !== undefined && input.minimum_score !== null) {
    const scoreVal = typeof input.minimum_score === 'string' 
      ? input.minimum_score.trim() 
      : input.minimum_score;
    
    if (scoreVal === "Any" || scoreVal === "") {
      minimum_score = "Any";
    } else {
      const numScore = typeof scoreVal === 'number' ? scoreVal : parseInt(String(scoreVal), 10);
      if (!isNaN(numScore)) {
        if (numScore >= 80) minimum_score = 80;
        else if (numScore >= 70) minimum_score = 70;
        else if (numScore >= 60) minimum_score = 60;
        else if (numScore >= 50) minimum_score = 50;
        else minimum_score = "Any";
      }
    }
  }

  // Normalize sort_by
  let sort_by: "Best Match" | "Newest" | "Oldest" | "Company A–Z" = "Best Match";
  if (input.sort_by && typeof input.sort_by === 'string') {
    const sortVal = input.sort_by.trim();
    if (sortVal === "Newest" || sortVal === "Oldest" || sortVal === "Company A–Z") {
      sort_by = sortVal;
    } else if (sortVal === "Best Match" || sortVal === "score") {
      sort_by = "Best Match";
    }
  }

  return { location, minimum_score, sort_by };
}

/**
 * Check if location matches (case-insensitive substring match)
 */
function locationMatches(jobLocation: string | null, filterLocation: string | null): boolean {
  if (!filterLocation) return true;
  if (!jobLocation) return false;
  return jobLocation.toLowerCase().includes(filterLocation.toLowerCase());
}

/**
 * Apply filters and sorting to jobs
 */
export function filterAndSortJobs(jobs: Job[], filters: FilterInput): FilterOutput {
  const normalized = normalizeFilters(filters);
  
  // Step 1: Apply minimum_score filter
  let filtered = jobs;
  if (normalized.minimum_score !== "Any") {
    filtered = jobs.filter(job => {
      const score = job.score ?? 0;
      return score >= normalized.minimum_score;
    });
  }

  // Step 2: Sort jobs
  const sorted = [...filtered].sort((a, b) => {
    // Helper: Get effective score (treat null as 0)
    const getScore = (job: Job) => job.score ?? 0;
    
    // Helper: Get effective date (treat null as very old/new depending on sort)
    const getDate = (job: Job) => {
      if (!job.posted_at) return null;
      try {
        return new Date(job.posted_at).getTime();
      } catch {
        return null;
      }
    };
    
    // Helper: Get company name for sorting
    const getCompany = (job: Job) => (job.company || "").toLowerCase();
    
    // Helper: Check location match for boost
    const locationMatchA = locationMatches(a.location, normalized.location);
    const locationMatchB = locationMatches(b.location, normalized.location);
    
    // Primary sort based on sort_by
    let primaryComparison = 0;
    
    switch (normalized.sort_by) {
      case "Best Match":
        primaryComparison = getScore(b) - getScore(a); // Descending
        break;
        
      case "Newest":
        const dateA = getDate(a);
        const dateB = getDate(b);
        if (dateA === null && dateB === null) primaryComparison = 0;
        else if (dateA === null) primaryComparison = 1; // Push nulls to end
        else if (dateB === null) primaryComparison = -1;
        else primaryComparison = dateB - dateA; // Descending (newest first)
        break;
        
      case "Oldest":
        const dateAOld = getDate(a);
        const dateBOld = getDate(b);
        if (dateAOld === null && dateBOld === null) primaryComparison = 0;
        else if (dateAOld === null) primaryComparison = 1; // Push nulls to end
        else if (dateBOld === null) primaryComparison = -1;
        else primaryComparison = dateAOld - dateBOld; // Ascending (oldest first)
        break;
        
      case "Company A–Z":
        const compA = getCompany(a);
        const compB = getCompany(b);
        if (!compA && !compB) primaryComparison = 0;
        else if (!compA) primaryComparison = 1; // Push empty to end
        else if (!compB) primaryComparison = -1;
        else primaryComparison = compA.localeCompare(compB);
        break;
    }
    
    // If primary comparison is equal, apply location boost
    if (primaryComparison === 0 && normalized.location) {
      if (locationMatchA && !locationMatchB) return -1;
      if (!locationMatchA && locationMatchB) return 1;
    }
    
    // If still equal and sort is "Best Match", use posted_at as tiebreaker
    if (primaryComparison === 0 && normalized.sort_by === "Best Match") {
      const dateA = getDate(a);
      const dateB = getDate(b);
      if (dateA !== null && dateB !== null) {
        return dateB - dateA; // Newer first
      }
    }
    
    return primaryComparison;
  });

  // Step 3: Apply location preference boost (already handled in sorting above)
  
  return {
    filtered_jobs: sorted,
    applied_filters: normalized,
  };
}
