// FILE: src/app/(seeker)/blog/page.tsx
// Blog index: every post, newest first, from content/blog/posts.ts.
import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '../../../components/schema/JsonLd';
import { BLOG_POSTS } from '../../../content/blog/posts';
import { buildBreadcrumbListSchema, buildItemListSchema } from '../../../lib/schema';
import { absoluteUrl } from '../../../lib/site-url';

const TITLE = 'Blog — tech job search advice for India';
const DESCRIPTION = 'Practical guides for finding tech jobs in India: remote roles, fresher jobs, city hiring guides and interview preparation, from the JobMesh team.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl('/blog') },
  openGraph: { title: TITLE, description: DESCRIPTION, url: absoluteUrl('/blog'), type: 'website', locale: 'en_IN' },
};

export default function BlogIndex() {
  const posts = [...BLOG_POSTS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return (
    <main style={{ width: '100%', maxWidth: 760, margin: '0 auto', padding: 'clamp(20px, 4vw, 40px) clamp(16px, 4vw, 24px) 64px' }}>
      <JsonLd schema={buildBreadcrumbListSchema([{ name: 'Blog', path: '/blog' }])} />
      <JsonLd schema={buildItemListSchema(posts.map(post => ({ path: `/blog/${post.slug}`, name: post.title })))} />
      <h1 className="font-display" style={{ fontSize: 'clamp(2rem, 4.5vw, 2.8rem)', fontWeight: 400, letterSpacing: '-0.03em' }}>JobMesh blog</h1>
      <p style={{ marginTop: 10, color: 'var(--ink-muted)', lineHeight: 1.6 }}>{DESCRIPTION}</p>
      <ul style={{ listStyle: 'none', padding: 0, margin: '28px 0 0', display: 'grid', gap: 12 }}>
        {posts.map(post => (
          <li key={post.slug}>
            <Link href={`/blog/${post.slug}`} className="glass jb-link-card" style={{ display: 'block', padding: '18px 20px', borderRadius: 12, textDecoration: 'none', color: 'inherit' }}>
              <span style={{ display: 'block', fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>{post.title}</span>
              <span style={{ display: 'block', marginTop: 6, fontSize: 14, lineHeight: 1.55, color: 'var(--ink-muted)' }}>{post.description}</span>
            </Link>
          </li>
        ))}
      </ul>
      <p style={{ marginTop: 32 }}>Ready to look? <Link href="/tech-jobs">Browse tech jobs by city and role</Link>.</p>
    </main>
  );
}
