// FILE: settings/email/page.tsx
import type { Metadata } from 'next';
import EmailSettingsClient from './EmailSettingsClient';

export const metadata: Metadata = {
  title: 'Email | JobMesh Employer',
  robots: { index: false },
};

export default function EmailSettingsPage() {
  return <EmailSettingsClient />;
}
