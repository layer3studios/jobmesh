// FILE: src/app/(seeker)/blog/[slug]/page.tsx
// One blog post. Markdown from the blog_posts collection (written in the admin
// panel at /admin/blog, served by /api/public/blog), rendered on the server
// (no raw HTML — react-markdown without rehype-raw, as in shared/Markdown.tsx),
// with Article + BreadcrumbList JSON-LD. Internal links render as next/link.
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { JsonLd } from '../../../../components/schema/JsonLd';
import { getPublishedBlogPostServer, getPublishedBlogPostsServer } from '../../../../lib/server-api/blog';
import { buildArticleSchema, buildBreadcrumbListSchema, buildFaqPageSchema } from '../../../../lib/schema';
import { absoluteUrl } from '../../../../lib/site-url';

// New posts appear without a deploy: pages render on first request, then cache.
export const revalidate = 60;

// There is deliberately NO generateStaticParams here.
//
// It used to be present, and it made every published post return 500 with
// digest DYNAMIC_SERVER_USAGE. The (seeker) layout calls getSeekerMeServer(),
// which reads the seeker cookie, so every page in this group is inherently
// dynamic. Declaring generateStaticParams asks Next to render this page
// statically inside a layout that cannot be static, and the render throws.
//
// The sibling listing page never hit this because it declares no params and is
// simply rendered per request. Nothing is lost by matching it: freshness still
// comes from the 60-second data cache in publicServerFetch, so repeat renders
// do not re-hit Express.
//
// If this group ever stops reading cookies in its layout, prerendering the
// published slugs becomes possible again — and only then.

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedBlogPostServer(slug).catch(() => null);
  if (!post) return { title: 'Post not found', robots: { index: false } };
  const url = absoluteUrl(`/blog/${post.slug}`);
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article', title: post.title, description: post.description, url, locale: 'en_IN',
      publishedTime: post.publishedAt ?? undefined, modifiedTime: post.updatedAt ?? post.publishedAt ?? undefined, tags: post.tags,
    },
    twitter: { card: 'summary', title: post.title, description: post.description },
  };
}

// remark-gfm parses tables, H3s and the rest, but anything not mapped here
// rendered with bare browser defaults — black-on-white tables on a dark page.
// The top-ranking competitor page for these queries leads with a
// quick-reference table, so this is table stakes rather than decoration.
const components: Components = {
  a: ({ href, children }) => (href?.startsWith('/')
    ? <Link href={href}>{children}</Link>
    : <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>),
  h2: ({ children }) => <h2 style={{ fontSize: '1.4rem', fontWeight: 600, margin: '2em 0 0.6em', letterSpacing: '-0.01em' }}>{children}</h2>,
  h3: ({ children }) => <h3 style={{ fontSize: '1.1rem', fontWeight: 600, margin: '1.6em 0 0.5em' }}>{children}</h3>,
  p: ({ children }) => <p style={{ margin: '0 0 1.1em' }}>{children}</p>,
  ul: ({ children }) => <ul style={{ margin: '0 0 1.1em', paddingLeft: '1.3em', display: 'grid', gap: 6 }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ margin: '0 0 1.1em', paddingLeft: '1.3em', display: 'grid', gap: 6 }}>{children}</ol>,
  strong: ({ children }) => <strong style={{ fontWeight: 600, color: 'var(--ink)' }}>{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote style={{
      margin: '0 0 1.1em', padding: '2px 0 2px 16px',
      borderLeft: '2px solid var(--accent)', color: 'var(--ink-muted)',
    }}>{children}</blockquote>
  ),
  code: ({ children }) => (
    <code style={{
      fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: '0.88em',
      background: 'var(--surface-2)', border: '1px solid var(--border)',
      borderRadius: 4, padding: '1px 5px',
    }}>{children}</code>
  ),
  hr: () => <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: '2.2em 0' }} />,
  // The wrapper scrolls instead of the page: a 4-column table has nowhere to go
  // on a 360px screen, and overflowing the body breaks the whole layout.
  table: ({ children }) => (
    <div style={{ overflowX: 'auto', margin: '0 0 1.4em' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th style={{
      textAlign: 'left', padding: '8px 12px', whiteSpace: 'nowrap',
      borderBottom: '1px solid var(--border-loud)', color: 'var(--ink-2)',
      fontWeight: 600, fontSize: 13,
    }}>{children}</th>
  ),
  td: ({ children }) => (
    <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', verticalAlign: 'top' }}>{children}</td>
  ),
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPublishedBlogPostServer(slug);
  if (!post) notFound();
  const others = (await getPublishedBlogPostsServer().catch(() => []))
    .filter(other => other.slug !== post.slug).slice(0, 3);
  const publishedAt = post.publishedAt ?? post.updatedAt ?? new Date().toISOString();
  const faqSchema = buildFaqPageSchema(post.body);

  return (
    <main style={{ width: '100%', maxWidth: 760, margin: '0 auto', padding: 'clamp(20px, 4vw, 40px) clamp(16px, 4vw, 24px) 64px' }}>
      <JsonLd schema={buildArticleSchema({
        title: post.title, description: post.description, path: `/blog/${post.slug}`,
        publishedAt, updatedAt: post.updatedAt ?? undefined, author: post.author,
      })} />
      <JsonLd schema={buildBreadcrumbListSchema([
        { name: 'Blog', path: '/blog' },
        { name: post.title, path: `/blog/${post.slug}` },
      ])} />
      {/* Emitted only when the post actually has an FAQ section, so the markup
          always matches what the reader can see. */}
      {faqSchema && <JsonLd schema={faqSchema} />}

      <Link href="/blog" style={{ fontSize: 13, textDecoration: 'none', color: 'var(--ink-muted)' }}>← Blog</Link>
      <article>
        <header style={{ margin: '16px 0 28px' }}>
          <h1 className="font-display" style={{ fontSize: 'clamp(2rem, 4.5vw, 2.8rem)', fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {post.title}
          </h1>
          <p style={{ marginTop: 12, fontSize: 14, color: 'var(--ink-muted)' }}>
            {post.author} · <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
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
