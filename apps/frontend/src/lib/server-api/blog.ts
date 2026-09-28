// FILE: src/lib/server-api/blog.ts
// Server reads of the published blog (/api/public/blog). Posts are written in
// the admin panel (/admin/blog) and stored in the blog_posts collection.
import { publicServerFetch } from '../public-server-fetch';
import { ServerFetchError } from '../server-fetch';

export interface BlogPostSummary {
  slug: string;
  title: string;
  description: string;
  author: string;
  tags: string[];
  publishedAt: string | null;
  updatedAt: string | null;
}

export interface BlogPost extends BlogPostSummary { body: string }

/** Short window: an admin's publish should show up within a minute. */
const BLOG_REVALIDATE = 60;

export async function getPublishedBlogPostsServer(): Promise<BlogPostSummary[]> {
  const body = await publicServerFetch<{ data?: { posts?: BlogPostSummary[] } }>('/public/blog', BLOG_REVALIDATE);
  return body.data?.posts ?? [];
}

/** null when the post does not exist or is not published. */
export async function getPublishedBlogPostServer(slug: string): Promise<BlogPost | null> {
  try {
    const body = await publicServerFetch<{ data?: { post?: BlogPost } }>(
      `/public/blog/${encodeURIComponent(slug)}`, BLOG_REVALIDATE,
    );
    return body.data?.post ?? null;
  } catch (error) {
    if (error instanceof ServerFetchError && error.status === 404) return null;
    throw error;
  }
}
