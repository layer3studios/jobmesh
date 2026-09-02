// FILE: admin/audit-log/page.tsx
// Audit Log. Client-rendered to match the rest of the admin panel's data pages.
import type { Metadata } from 'next';
import AuditLogClient from './AuditLogClient';

export const metadata: Metadata = {
  title: 'Audit Log · JobMesh Admin',
  robots: { index: false, follow: false },
};

export default function AdminAuditLogPage() {
  return <AuditLogClient />;
}
