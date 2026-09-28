// FILE: admin/blog/[postId]/page.tsx
import type { Metadata } from 'next';
import BlogEditorClient from '../parts/BlogEditorClient';

export const metadata: Metadata = {
  title: 'Edit post · JobMesh Admin',
  robots: { index: false, follow: false },
};

export default async function AdminEditBlogPostPage({ params }: { params: Promise<{ postId: string }> }) {
  const { postId } = await params;
  return <BlogEditorClient postId={postId} />;
}
