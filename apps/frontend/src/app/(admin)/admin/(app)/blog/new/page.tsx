// FILE: admin/blog/new/page.tsx
import type { Metadata } from 'next';
import BlogEditorClient from '../parts/BlogEditorClient';

export const metadata: Metadata = {
  title: 'New post · JobMesh Admin',
  robots: { index: false, follow: false },
};

export default function AdminNewBlogPostPage() {
  return <BlogEditorClient />;
}
