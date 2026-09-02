// FILE: admin/queues/page.tsx
// Queue monitor. Client-rendered: queue depth moves while the page is open, so
// an SSR snapshot would be stale on arrival.
import type { Metadata } from 'next';
import QueuesClient from './QueuesClient';

export const metadata: Metadata = {
  title: 'Queues · JobMesh Admin',
  robots: { index: false, follow: false },
};

export default function AdminQueuesPage() {
  return <QueuesClient />;
}
