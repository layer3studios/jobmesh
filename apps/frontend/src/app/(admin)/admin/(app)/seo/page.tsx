// FILE: admin/seo/page.tsx
// SEO & indexing panel. Client-rendered: the queue drains in the background, so
// an SSR snapshot would be stale on arrival.
import type { Metadata } from 'next';
import SeoClient from './SeoClient';

export const metadata: Metadata = {
  title: 'SEO & Indexing · JobMesh Admin',
  robots: { index: false, follow: false },
};

export default function AdminSeoPage() {
  return <SeoClient />;
}
