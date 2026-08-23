// FILE: src/components/seeker/profile/GitHubRepoGrid.tsx
// The repository cards under the GitHub panel.
//
// PINS BEAT STARS when the candidate set any. Pinned repos are a deliberate
// statement about what they want read first — often the thing they are proudest
// of rather than the thing strangers starred — and overriding that with a
// popularity ranking would throw away the one piece of editorial judgement the
// candidate actually made about their own work.
//
// Split from GitHubStats purely for size (section 2).

import { Star, GitFork } from 'lucide-react';
import type { GitHubRepo } from '@/types/seeker-profile';

export default function GitHubRepoGrid({ pinned, top }: {
  pinned: GitHubRepo[] | null;
  top: GitHubRepo[];
}) {
  const usingPins = Boolean(pinned && pinned.length > 0);
  const repos = usingPins ? pinned! : top;
  if (repos.length === 0) return null;

  return (
    <section>
      <h4 className="lc-section-heading">
        {usingPins ? 'Pinned repositories' : 'Top repositories'}
      </h4>
      <div className="gh-repo-grid">
        {repos.map((repo) => (
          <article className="gh-repo-card" key={repo.url}>
            <a
              className="gh-repo-name"
              href={repo.url}
              target="_blank"
              rel="noreferrer noopener"
              title={repo.name}
            >
              {repo.name}
            </a>
            {repo.description && <p className="gh-repo-desc">{repo.description}</p>}
            <div className="gh-repo-meta">
              {repo.language && (
                <span className="gh-repo-meta-item">
                  <span
                    className="gh-lang-dot"
                    // GitHub's own hex for the language, straight from the API.
                    // Falls back to a token when GitHub has no colour for it.
                    style={{ background: repo.languageColor ?? 'var(--ink-faint)' }}
                    aria-hidden="true"
                  />
                  {repo.language}
                </span>
              )}
              {/* Zero stars or forks are omitted rather than shown as 0: on a
                  card this small, a row of zeroes reads as a verdict. */}
              {repo.stars > 0 && (
                <span className="gh-repo-meta-item">
                  <Star size={11} aria-hidden="true" />
                  {repo.stars.toLocaleString()}
                  <span className="sr-only"> stars</span>
                </span>
              )}
              {repo.forks > 0 && (
                <span className="gh-repo-meta-item">
                  <GitFork size={11} aria-hidden="true" />
                  {repo.forks.toLocaleString()}
                  <span className="sr-only"> forks</span>
                </span>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
