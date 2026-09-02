// FILE: admin/page.tsx
// Admin home. Was a redirect to employer-access; now Mission Control — the
// platform's health at a glance. Client-rendered: the status strip is a live
// view of the DB, the queues and the AI budget, so an SSR snapshot would be
// stale on arrival.
import type { Metadata } from 'next';
import MissionControlClient from './MissionControlClient';

export const metadata: Metadata = {
  title: 'Mission Control · JobMesh Admin',
  robots: { index: false, follow: false },
};

export default function AdminIndexPage() {
  return <MissionControlClient />;
}
