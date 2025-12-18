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
  radius_km?: number | null;
  minimum_score?: string | number | null;
  sort_by?: string | null;
};

type FilterOutput = {
  filtered_jobs: Job[];
  applied_filters: {
    location: string | null;
    radius_km: number | null;
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

  // Normalize radius_km
  let radius_km: number | null = null;
  if (location && input.radius_km !== undefined && input.radius_km !== null) {
    const radiusVal = typeof input.radius_km === 'number' ? input.radius_km : parseFloat(String(input.radius_km));
    if (!isNaN(radiusVal) && radiusVal > 0) {
      radius_km = radiusVal;
    }
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

  return { location, radius_km, minimum_score, sort_by };
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
    const threshold = normalized.minimum_score as number;
    filtered = jobs.filter(job => {
      const score = job.score ?? 0;
      return score >= threshold;
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
    
    // Helper: Check location match for proximity preference
    const locationMatchA = locationMatches(a.location, normalized.location);
    const locationMatchB = locationMatches(b.location, normalized.location);
    
    // Primary sort based on sort_by
    let primaryComparison = 0;
    
    switch (normalized.sort_by) {
      case "Best Match":
        // Primary: score descending
        primaryComparison = getScore(b) - getScore(a);
        // Secondary: location match
        if (primaryComparison === 0 && normalized.location) {
          if (locationMatchA && !locationMatchB) return -1;
          if (!locationMatchA && locationMatchB) return 1;
        }
        // Tertiary: posted_at descending
        if (primaryComparison === 0) {
          const dateA = getDate(a);
          const dateB = getDate(b);
          if (dateA !== null && dateB !== null) {
            return dateB - dateA;
          }
        }
        break;
        
      case "Newest":
        // Primary: posted_at descending
        const dateA = getDate(a);
        const dateB = getDate(b);
        if (dateA === null && dateB === null) primaryComparison = 0;
        else if (dateA === null) primaryComparison = 1; // Push nulls to end
        else if (dateB === null) primaryComparison = -1;
        else primaryComparison = dateB - dateA;
        // Secondary: location match
        if (primaryComparison === 0 && normalized.location) {
          if (locationMatchA && !locationMatchB) return -1;
          if (!locationMatchA && locationMatchB) return 1;
        }
        // Tertiary: score descending
        if (primaryComparison === 0) {
          return getScore(b) - getScore(a);
        }
        break;
        
      case "Oldest":
        // Primary: posted_at ascending
        const dateAOld = getDate(a);
        const dateBOld = getDate(b);
        if (dateAOld === null && dateBOld === null) primaryComparison = 0;
        else if (dateAOld === null) primaryComparison = 1; // Push nulls to end
        else if (dateBOld === null) primaryComparison = -1;
        else primaryComparison = dateAOld - dateBOld;
        // Secondary: location match
        if (primaryComparison === 0 && normalized.location) {
          if (locationMatchA && !locationMatchB) return -1;
          if (!locationMatchA && locationMatchB) return 1;
        }
        // Tertiary: score descending
        if (primaryComparison === 0) {
          return getScore(b) - getScore(a);
        }
        break;
        
      case "Company A–Z":
        // Primary: alphabetical by company
        const compA = getCompany(a);
        const compB = getCompany(b);
        if (!compA && !compB) primaryComparison = 0;
        else if (!compA) primaryComparison = 1; // Push empty to end
        else if (!compB) primaryComparison = -1;
        else primaryComparison = compA.localeCompare(compB);
        // Secondary: location match
        if (primaryComparison === 0 && normalized.location) {
          if (locationMatchA && !locationMatchB) return -1;
          if (!locationMatchA && locationMatchB) return 1;
        }
        break;
    }
    
    return primaryComparison;
  });

  // Step 3: Apply location preference boost (already handled in sorting above)
  
  return {
    filtered_jobs: sorted,
    applied_filters: normalized,
  };
}