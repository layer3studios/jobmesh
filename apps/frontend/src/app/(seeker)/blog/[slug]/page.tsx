// FILE: src/app/(seeker)/blog/[slug]/page.tsx
// One blog post. Markdown from content/blog/posts.ts, rendered on the server
// (no raw HTML — react-markdown without rehype-raw, as in shared/Markdown.tsx),
// with Article + BreadcrumbList JSON-LD. Internal links render as next/link.
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { JsonLd } from '../../../../components/schema/JsonLd';
import { BLOG_POSTS, findBlogPost } from '../../../../content/blog/posts';
import { buildArticleSchema, buildBreadcrumbListSchema } from '../../../../lib/schema';
import { absoluteUrl } from '../../../../lib/site-url';

export const dynamicParams = false;

export function generateStaticParams() {
  return BLOG_POSTS.map(post => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = findBlogPost(slug);
  if (!post) return { title: 'Post not found', robots: { index: false } };
  const url = absoluteUrl(`/blog/${post.slug}`);
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article', title: post.title, description: post.description, url, locale: 'en_IN',
      publishedTime: post.publishedAt, modifiedTime: post.updatedAt ?? post.publishedAt, tags: post.tags,
    },
    twitter: { card: 'summary', title: post.title, description: post.description },
  };
}

const components: Components = {
  a: ({ href, children }) => (href?.startsWith('/')
    ? <Link href={href}>{children}</Link>
    : <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>),
  h2: ({ children }) => <h2 style={{ fontSize: '1.4rem', fontWeight: 600, margin: '2em 0 0.6em', letterSpacing: '-0.01em' }}>{children}</h2>,
  p: ({ children }) => <p style={{ margin: '0 0 1.1em' }}>{children}</p>,
  ul: ({ children }) => <ul style={{ margin: '0 0 1.1em', paddingLeft: '1.3em', display: 'grid', gap: 6 }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ margin: '0 0 1.1em', paddingLeft: '1.3em', display: 'grid', gap: 6 }}>{children}</ol>,
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = findBlogPost(slug);
  if (!post) notFound();
  const others = BLOG_POSTS.filter(other => other.slug !== post.slug).slice(0, 3);

  return (
    <main style={{ width: '100%', maxWidth: 760, margin: '0 auto', padding: 'clamp(20px, 4vw, 40px) clamp(16px, 4vw, 24px) 64px' }}>
      <JsonLd schema={buildArticleSchema({
        title: post.title, description: post.description, path: `/blog/${post.slug}`,
        publishedAt: post.publishedAt, updatedAt: post.updatedAt, author: post.author,
      })} />
      <JsonLd schema={buildBreadcrumbListSchema([
        { name: 'Blog', path: '/blog' },
        { name: post.title, path: `/blog/${post.slug}` },
      ])} />

      <Link href="/blog" style={{ fontSize: 13, textDecoration: 'none', color: 'var(--ink-muted)' }}>← Blog</Link>
      <article>
        <header style={{ margin: '16px 0 28px' }}>
          <h1 className="font-display" style={{ fontSize: 'clamp(2rem, 4.5vw, 2.8rem)', fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {post.title}
          </h1>
          <p style={{ marginTop: 12, fontSize: 14, color: 'var(--ink-muted)' }}>
            {post.author} · <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
          </p>
        </header>
        <div style={{ fontSize: 17, lineHeight: 1.7, color: 'var(--ink)' }}>
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{post.body}</ReactMarkdown>
        </div>
      </article>

      {others.length > 0 && (
        <aside style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)' }} aria-labelledby="more-posts">
          <h2 id="more-posts" style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>More from the blog</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
            {others.map(other => <li key={other.slug}><Link href={`/blog/${other.slug}`}>{other.title}</Link></li>)}
          </ul>
        </aside>
      )}
    </main>
  );
}
