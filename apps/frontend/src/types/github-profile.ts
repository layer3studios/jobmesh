// FILE: src/types/github-profile.ts
// The shape of a candidate's public GitHub record, as the backend's
// shapeGitHubData produces it. Split from seeker-profile.ts for size; import
// either from here or via the re-export on seeker-profile.
/** One repository card, from either the star ranking or the candidate's pins. */
export interface GitHubRepo {
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  /** GitHub's own hex for that language, e.g. "#f1e05a". Data, not a design token. */
  languageColor: string | null;
  url: string;
  updatedAt?: string | null;
}

export interface GitHubProfile {
  username: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  followers: number;
  following: number;

  publicRepoCount: number;
  totalStars: number;
  totalForks: number;

  totalContributions: number;
  totalCommits: number;
  totalPullRequests: number;
  totalIssues: number;
  totalReviews: number;
  /** Work in private repos, shown only when the candidate opted into publishing it. */
  privateContributions: number;

  languages: Array<{ name: string; repoCount: number; color: string | null }>;
  topRepos: GitHubRepo[];
  /** The candidate's own showcase. Null when they have pinned nothing. */
  pinnedRepos: GitHubRepo[] | null;

  /** JSON string, `{ "YYYY-MM-DD": count }` — the shape ContributionHeatmap reads. */
  contributionCalendar: string;
  fetchedAt: string;
  /** Set when served from an expired cache because GitHub could not be reached. */
  isStale?: boolean;
}

/** The GET response: connected is about the ACCOUNT, data about the last read. */
export interface GitHubConnection {
  connected: boolean;
  /** False when the server has no GITHUB_API_TOKEN — the card explains rather than offers. */
  available?: boolean;
  username?: string;
  data?: GitHubProfile | null;
}

