// FILE: src/services/seeker/github-shape.js
// Raw GitHub GraphQL response → the shape everything downstream reads.
//
// Split from the fetch for the same reason shapeLeetCodeData is exported: this is
// pure, it is where every defensive default lives, and it is the only part of the
// integration testable without a network or a token.
//
// GitHub returns nulls freely — a user with no bio, a repo with no language, an
// account whose contribution collection is empty — so every field here has a
// default and nothing assumes an object exists.

/** Enough to fill a two-column grid without turning the panel into a repo list. */
const REPO_LIMIT = 6;

/** One repo card's worth of fields, from either the top-starred list or the pins. */
const toRepoCard = (repo) => ({
  name: repo.name,
  description: repo.description ?? null,
  stars: repo.stargazerCount ?? 0,
  forks: repo.forkCount ?? 0,
  language: repo.primaryLanguage?.name ?? null,
  // GitHub's own per-language hex. Carried through as DATA, not a token: these are
  // the colours GitHub itself paints, and recognising them at a glance is the point.
  languageColor: repo.primaryLanguage?.color ?? null,
  url: repo.url,
  updatedAt: repo.updatedAt ?? null,
});

/** Repo counts per language, most-used first. Repos with no detected language drop out. */
function aggregateLanguages(repos) {
  const counts = new Map();
  for (const repo of repos) {
    const name = repo.primaryLanguage?.name;
    if (!name) continue;
    const existing = counts.get(name);
    counts.set(name, {
      name,
      repoCount: (existing?.repoCount ?? 0) + 1,
      // First one wins; GitHub's colour for a language is stable across repos.
      color: existing?.color ?? repo.primaryLanguage.color ?? null,
    });
  }
  return [...counts.values()].sort((a, b) => b.repoCount - a.repoCount);
}

/**
 * Flatten GitHub's weeks-of-days into `{ "YYYY-MM-DD": count }`.
 *
 * Zero-count days are DROPPED rather than stored: the grid is drawn from a date
 * range, not from these keys, so an empty day is already implied — and keeping 365
 * zeroes would roughly quadruple every cached row for no information.
 */
function buildCalendar(weeks) {
  const calendar = {};
  for (const week of weeks ?? []) {
    for (const day of week.contributionDays ?? []) {
      if (day.contributionCount > 0) calendar[day.date] = day.contributionCount;
    }
  }
  return calendar;
}

export function shapeGitHubData(user) {
  const repos = user.repositories?.nodes?.filter(Boolean) ?? [];
  const contributions = user.contributionsCollection ?? {};
  const calendar = contributions.contributionCalendar ?? {};
  const pinned = (user.pinnedItems?.nodes ?? []).filter((node) => node?.name);

  return {
    username: user.login,
    name: user.name ?? null,
    bio: user.bio ?? null,
    company: user.company ?? null,
    location: user.location ?? null,
    followers: user.followers?.totalCount ?? 0,
    following: user.following?.totalCount ?? 0,

    // totalCount is EVERY public repo they own; the star and fork sums below are
    // over the 100 we actually fetched. For anyone past 100 repos the tail is
    // unstarred by definition — the query is ordered by stars descending.
    publicRepoCount: user.repositories?.totalCount ?? 0,
    totalStars: repos.reduce((sum, repo) => sum + (repo.stargazerCount ?? 0), 0),
    totalForks: repos.reduce((sum, repo) => sum + (repo.forkCount ?? 0), 0),

    totalContributions: calendar.totalContributions ?? 0,
    totalCommits: contributions.totalCommitContributions ?? 0,
    totalPullRequests: contributions.totalPullRequestContributions ?? 0,
    totalIssues: contributions.totalIssueContributions ?? 0,
    totalReviews: contributions.totalPullRequestReviewContributions ?? 0,
    // Work in private repos, surfaced only as a count and only when the candidate
    // opted into showing it. It is what explains a thin heatmap under a strong
    // commit total, and without it that candidate just looks inactive.
    privateContributions: contributions.restrictedContributionsCount ?? 0,

    languages: aggregateLanguages(repos),
    topRepos: repos.filter((repo) => (repo.stargazerCount ?? 0) > 0)
      .slice(0, REPO_LIMIT).map(toRepoCard),
    // The candidate's own showcase beats a star ranking when they bothered to set
    // one — pins are a deliberate statement about what they want read first.
    pinnedRepos: pinned.length > 0 ? pinned.slice(0, REPO_LIMIT).map(toRepoCard) : null,

    // A JSON STRING, matching submissionCalendar, so one heatmap renders both.
    contributionCalendar: JSON.stringify(buildCalendar(calendar.weeks)),
    fetchedAt: new Date().toISOString(),
  };
}

export default shapeGitHubData;
