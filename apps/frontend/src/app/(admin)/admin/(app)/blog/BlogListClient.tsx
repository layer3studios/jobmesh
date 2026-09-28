'use client';
// FILE: admin/blog/BlogListClient.tsx
// Every blog post, drafts included, newest edit first. Only a super admin sees
// the "New post" button; the backend enforces the same rule on every write.

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Badge, Button } from '@/components/ui';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { useAdmin } from '@/context/admin/AdminContext';
import { fetchBlogPosts, type AdminBlogPost } from '@/api/admin-blog-api';

function formatDate(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

export default function BlogListClient() {
  const { admin } = useAdmin();
  const canWrite = admin?.role === 'super_admin';
  const [posts, setPosts] = useState<AdminBlogPost[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setError(false);
    try {
      setPosts(await fetchBlogPosts());
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <AdminPageHeader
        title="Blog"
        subtitle="Posts published here appear on jobmesh.in/blog within a minute. Markdown supported."
        actions={canWrite ? <Button as="a" href="/admin/blog/new">New post</Button> : undefined}
      />

      {!canWrite && (
        <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
          Read-only: only a super admin can write, publish or delete posts.
        </p>
      )}

      {error && (
        <div role="alert" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ color: 'var(--ink-muted)' }}>Couldn&apos;t load the posts.</span>
          <Button variant="secondary" size="sm" onClick={() => void load()}>Retry</Button>
        </div>
      )}

      {!posts && !error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="anim-pulse" style={{ height: 64, borderRadius: 10, background: 'var(--paper-2)' }} />
          ))}
        </div>
      )}

      {posts && posts.length === 0 && (
        <p style={{ color: 'var(--ink-muted)' }}>No posts yet.{canWrite ? ' Write the first one.' : ''}</p>
      )}

      {posts && posts.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {posts.map(post => (
            <li key={post.id}>
              <Link
                href={`/admin/blog/${post.id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', borderRadius: 10,
                  border: '1px solid var(--border)', background: 'var(--paper)', textDecoration: 'none', color: 'var(--ink)',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: 2 }}>/blog/{post.slug} · edited {formatDate(post.updatedAt)}</div>
                </div>
                <Badge variant={post.status === 'published' ? 'success' : 'neutral'}>{post.status === 'published' ? 'Published' : 'Draft'}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
