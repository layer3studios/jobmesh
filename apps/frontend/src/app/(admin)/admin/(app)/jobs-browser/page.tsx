// FILE: admin/jobs-browser/page.tsx
// Global job browser. Client-rendered: search, filters and moderation are all
// interactive, and results change as an admin works.
import type { Metadata } from 'next';
import JobsBrowserClient from './JobsBrowserClient';

export const metadata: Metadata = {
  title: 'Jobs · JobMesh Admin',
  robots: { index: false, follow: false },
};

export default function AdminJobsBrowserPage() {
  return <JobsBrowserClient />;
}
