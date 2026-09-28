// FILE: admin/blog/page.tsx
// Blog posts list. Client-rendered like the rest of the admin data pages.
import type { Metadata } from 'next';
import BlogListClient from './BlogListClient';

export const metadata: Metadata = {
  title: 'Blog · JobMesh Admin',
  robots: { index: false, follow: false },
};

export default function AdminBlogPage() {
  return <BlogListClient />;
}
