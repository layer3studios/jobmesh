// FILE: admin/alerts/page.tsx
// Alerts. Client-rendered to match the rest of the admin panel's data pages.
import type { Metadata } from 'next';
import AlertsClient from './AlertsClient';

export const metadata: Metadata = {
  title: 'Alerts · JobMesh Admin',
  robots: { index: false, follow: false },
};

export default function AdminAlertsPage() {
  return <AlertsClient />;
}
