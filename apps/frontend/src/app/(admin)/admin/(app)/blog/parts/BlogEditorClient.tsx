'use client';
// FILE: admin/blog/parts/BlogEditorClient.tsx
// Write or edit one blog post: title, URL slug, meta description, tags, and a
// Markdown body with a live preview. "Save draft" keeps it private; "Publish"
// puts it on jobmesh.in/blog. Plain admins get the same screen read-only (the
// backend rejects their writes anyway). The preview renders Markdown with NO
// raw HTML — exactly what the public page will show.

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button, Input, Modal, Textarea, useToast } from '@/components/ui';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { useAdmin } from '@/context/admin/AdminContext';
import {
  BlogApiError, createBlogPost, deleteBlogPost, fetchBlogPost, updateBlogPost,
  type AdminBlogPost, type BlogPostInput, type BlogPostStatus,
} from '@/api/admin-blog-api';

interface Draft { title: string; slug: string; description: string; tags: string; author: string; body: string }

const EMPTY: Draft = { title: '', slug: '', description: '', tags: '', author: 'JobMesh team', body: '' };

function slugify(title: string): string {
  return title.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100);
}

function toDraft(post: AdminBlogPost): Draft {
  return {
    title: post.title, slug: post.slug, description: post.description,
    tags: post.tags.join(', '), author: post.author, body: post.body ?? '',
  };
}

export default function BlogEditorClient({ postId }: { postId?: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const { admin } = useAdmin();
  const canWrite = admin?.role === 'super_admin';

  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [status, setStatus] = useState<BlogPostStatus>('draft');
  const [slugTouched, setSlugTouched] = useState(Boolean(postId));
  const [loading, setLoading] = useState(Boolean(postId));
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState<BlogPostStatus | 'delete' | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tab, setTab] = useState<'write' | 'preview'>('write');

  useEffect(() => {
    if (!postId) return;
    let cancelled = false;
    fetchBlogPost(postId)
      .then(post => { if (!cancelled) { setDraft(toDraft(post)); setStatus(post.status); } })
      .catch(() => { if (!cancelled) setLoadError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [postId]);

  const set = (key: keyof Draft) => (event: { target: { value: string } }) => {
    const value = event.target.value;
    setDraft(prev => ({
      ...prev,
      [key]: value,
      ...(key === 'title' && !slugTouched ? { slug: slugify(value) } : {}),
    }));
    if (key === 'slug') setSlugTouched(true);
  };

  const descriptionLength = draft.description.trim().length;
  const input = useMemo<BlogPostInput>(() => ({
    title: draft.title,
    slug: draft.slug,
    description: draft.description,
    body: draft.body,
    author: draft.author,
    tags: draft.tags.split(',').map(tag => tag.trim()).filter(Boolean),
  }), [draft]);

  async function save(nextStatus: BlogPostStatus) {
    setSaving(nextStatus);
    setErrors({});
    try {
      const saved = postId
        ? await updateBlogPost(postId, { ...input, status: nextStatus })
        : await createBlogPost({ ...input, status: nextStatus });
      setStatus(saved.status);
      showToast('success', nextStatus === 'published' ? 'Published — live on /blog within a minute' : 'Draft saved');
      if (!postId) router.replace(`/admin/blog/${saved.id}`);
    } catch (error) {
      if (error instanceof BlogApiError && Object.keys(error.fields).length) setErrors(error.fields);
      showToast('error', error instanceof Error ? error.message : 'Could not save the post');
    } finally {
      setSaving(null);
    }
  }

  async function remove() {
    if (!postId) return;
    setSaving('delete');
    try {
      await deleteBlogPost(postId);
      showToast('success', 'Post deleted');
      router.replace('/admin/blog');
    } catch {
      showToast('error', 'Could not delete the post');
      setSaving(null);
      setConfirmDelete(false);
    }
  }

  if (loading) {
    return <div className="anim-pulse" style={{ height: 400, borderRadius: 12, background: 'var(--paper-2)' }} />;
  }
  if (loadError) {
    return <p role="alert" style={{ color: 'var(--ink-muted)' }}>Couldn&apos;t load this post. It may have been deleted.</p>;
  }

  const readOnly = !canWrite;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <AdminPageHeader
        eyebrow="Admin · Blog"
        title={postId ? 'Edit post' : 'New post'}
        subtitle={status === 'published' ? `Live at jobmesh.in/blog/${draft.slug}` : 'Draft — not visible on the site'}
        actions={canWrite ? (
          <>
            {postId && <Button variant="ghost" onClick={() => setConfirmDelete(true)} disabled={saving !== null}>Delete</Button>}
            {status === 'published' && postId
              ? <Button variant="secondary" loading={saving === 'draft'} disabled={saving !== null} onClick={() => void save('draft')}>Unpublish</Button>
              : <Button variant="secondary" loading={saving === 'draft'} disabled={saving !== null} onClick={() => void save('draft')}>Save draft</Button>}
            <Button loading={saving === 'published'} disabled={saving !== null} onClick={() => void save('published')}>
              {status === 'published' ? 'Update' : 'Publish'}
            </Button>
          </>
        ) : undefined}
      />

      {readOnly && (
        <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)' }}>Read-only: only a super admin can edit posts.</p>
      )}

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <Input label="Title" required value={draft.title} onChange={set('title')} error={errors.title} maxLength={120} readOnly={readOnly} />
        <Input
          label="URL"
          hint={`jobmesh.in/blog/${draft.slug || '…'}`}
          value={draft.slug} onChange={set('slug')} error={errors.slug} maxLength={100} readOnly={readOnly}
        />
      </div>
      <Textarea
        label="Meta description"
        required rows={2} maxLength={200}
        hint={`${descriptionLength} characters — aim for 120-160. Shown under the title in Google.`}
        value={draft.description} onChange={set('description')} error={errors.description} readOnly={readOnly}
      />
      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <Input label="Tags" hint="Comma-separated, e.g. remote jobs, bangalore" value={draft.tags} onChange={set('tags')} error={errors.tags} readOnly={readOnly} />
        <Input label="Author" value={draft.author} onChange={set('author')} error={errors.author} maxLength={80} readOnly={readOnly} />
      </div>

      <div>
        <div role="tablist" style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          {(['write', 'preview'] as const).map(name => (
            <button
              key={name} type="button" role="tab" aria-selected={tab === name} onClick={() => setTab(name)}
              style={{
                padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem',
                border: '1px solid var(--border)', background: tab === name ? 'var(--ink)' : 'transparent',
                color: tab === name ? 'var(--paper)' : 'var(--ink)',
              }}
            >
              {name === 'write' ? 'Write' : 'Preview'}
            </button>
          ))}
        </div>
        {tab === 'write' ? (
          <Textarea
            aria-label="Post body (Markdown)"
            hint="Markdown: ## Heading, **bold**, - list, [link text](/tech-jobs/remote-jobs-in-india). Link to /tech-jobs pages to send readers to live jobs."
            rows={22} value={draft.body} onChange={set('body')} error={errors.body} readOnly={readOnly}
            style={{ fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace', fontSize: 14 }}
          />
        ) : (
          <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '20px 24px', lineHeight: 1.7, minHeight: 300 }}>
            <h1 style={{ fontSize: '1.8rem', marginBottom: 16 }}>{draft.title || 'Untitled'}</h1>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft.body || '*Nothing written yet.*'}</ReactMarkdown>
          </div>
        )}
      </div>

      <Modal
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this post?"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="danger" loading={saving === 'delete'} onClick={() => void remove()}>Delete</Button>
          </>
        )}
      >
        <p style={{ margin: 0 }}>
          &ldquo;{draft.title}&rdquo; will be removed from the site and its URL will stop working. This can&apos;t be undone —
          to hide it but keep it, unpublish instead.
        </p>
      </Modal>
    </div>
  );
}
