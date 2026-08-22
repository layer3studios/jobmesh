// FILE: admin/ai-usage/page.tsx
// AI usage dashboard. Client-rendered: currentLimits is a live in-memory view
// on the server, so SSR would ship a snapshot that is stale on arrival.
import type { Metadata } from 'next';
import AdminAiUsageClient from './AdminAiUsageClient';

export const metadata: Metadata = {
  title: 'AI Usage · JobMesh Admin',
  robots: { index: false, follow: false },
};

export default function AdminAiUsagePage() {
  return <AdminAiUsageClient />;
}
