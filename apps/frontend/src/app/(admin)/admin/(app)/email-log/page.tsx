// FILE: admin/email-log/page.tsx
// Email Log. Client-rendered to match the rest of the admin panel's data pages.
import type { Metadata } from 'next';
import EmailLogClient from './EmailLogClient';

export const metadata: Metadata = {
  title: 'Email Log · JobMesh Admin',
  robots: { index: false, follow: false },
};

export default function AdminEmailLogPage() {
  return <EmailLogClient />;
}
