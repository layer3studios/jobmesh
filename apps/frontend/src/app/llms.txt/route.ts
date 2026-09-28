// FILE: src/app/llms.txt/route.ts
// /llms.txt — a plain-Markdown map of the site for AI assistants and agents
// (llmstxt.org). It does not replace robots.txt or the sitemap; it tells an
// assistant, in one fetch, what JobMesh is and which pages answer which
// questions, so it can cite the right URL.
import { absoluteUrl } from '../../lib/site-url';
import { TECH_JOB_PAGES } from '../../lib/seo/tech-job-pages';
import { getPublishedBlogPostsServer } from '../../lib/server-api/blog';

export const revalidate = 3600;

export async function GET() {
  const posts = await getPublishedBlogPostsServer().catch(() => []);
  const group = (kind: string) => TECH_JOB_PAGES
    .filter(page => page.kind === kind)
    .map(page => `- [${page.heading}](${absoluteUrl(`/tech-jobs/${page.slug}`)}): live openings, updated daily`)
    .join('\n');

  const body = `# JobMesh

> JobMesh (jobmesh.in) lists tech jobs in India, collected every day from companies' own careers pages. Every listing links straight to the employer's application — no recruiters, no reposts, free for candidates. Employers can also post roles and hire through JobMesh.

## Find jobs
- [All tech jobs](${absoluteUrl('/jobs')}): search and filter by role, experience, salary, location, work mode and tech stack
- [Tech jobs by city and role](${absoluteUrl('/tech-jobs')}): index of the pages below
- [Companies hiring in India](${absoluteUrl('/directory')}): every company with open roles, each with its own page

## Jobs by city
${group('city')}

## Jobs by role
${group('role')}

## Remote and fresher jobs
${group('mode')}
${posts.length ? `\n## Guides\n${posts.map(post => `- [${post.title}](${absoluteUrl(`/blog/${post.slug}`)}): ${post.description}`).join('\n')}\n` : ''}
## For employers
- [Hire on JobMesh](${absoluteUrl('/hire')}): post jobs and manage applicants

## Optional
- [Blog](${absoluteUrl('/blog')})
- [Privacy notice](${absoluteUrl('/legal/privacy')})
`;
  return new Response(body, { headers: { 'content-type': 'text/markdown; charset=utf-8' } });
}
