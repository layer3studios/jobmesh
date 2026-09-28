// FILE: src/api/admin-blog-api.ts
// Client for /api/admin/blog. Forwards the admin cookie (credentials: 'include')
// to a RELATIVE /api path, like the other admin clients. Non-2xx throws
// BlogApiError, carrying per-field messages from a 400 in `fields`.

export type BlogPostStatus = 'draft' | 'published';

export interface AdminBlogPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  body?: string;
  author: string;
  tags: string[];
  status: BlogPostStatus;
  publishedAt: string | null;
  updatedAt: string | null;
  createdAt: string | null;
}

export interface BlogPostInput {
  title: string;
  slug?: string;
  description: string;
  body: string;
  author?: string;
  tags?: string[];
  status?: BlogPostStatus;
}

const BASE = '/api/admin/blog';

export class BlogApiError extends Error {
  status: number;
  code: string | null;
  fields: Record<string, string>;

  constructor(status: number, code: string | null, message: string, fields: Record<string, string> = {}) {
    super(message);
    this.name = 'BlogApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, { credentials: 'include', ...init });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new BlogApiError(response.status, body?.code ?? null, body?.error || `Request failed (${response.status})`, body?.details ?? {});
  }
  return body.data as T;
}

const json = (method: string, payload: unknown): RequestInit => ({
  method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
});

export async function fetchBlogPosts(): Promise<AdminBlogPost[]> {
  return (await requestJson<{ posts: AdminBlogPost[] }>('')).posts;
}

export async function fetchBlogPost(id: string): Promise<AdminBlogPost> {
  return (await requestJson<{ post: AdminBlogPost }>(`/${encodeURIComponent(id)}`)).post;
}

export async function createBlogPost(input: BlogPostInput): Promise<AdminBlogPost> {
  return (await requestJson<{ post: AdminBlogPost }>('', json('POST', input))).post;
}

export async function updateBlogPost(id: string, input: Partial<BlogPostInput>): Promise<AdminBlogPost> {
  return (await requestJson<{ post: AdminBlogPost }>(`/${encodeURIComponent(id)}`, json('PATCH', input))).post;
}

export async function deleteBlogPost(id: string): Promise<void> {
  await requestJson(`/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
