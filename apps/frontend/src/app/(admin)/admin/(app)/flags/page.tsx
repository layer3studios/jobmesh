// FILE: admin/flags/page.tsx
// Feature Flags. Client-rendered to match the rest of the admin panel's data pages.
import type { Metadata } from 'next';
import FlagsClient from './FlagsClient';

export const metadata: Metadata = {
  title: 'Feature Flags · JobMesh Admin',
  robots: { index: false, follow: false },
};

export default function AdminFlagsPage() {
  return <FlagsClient />;
}
