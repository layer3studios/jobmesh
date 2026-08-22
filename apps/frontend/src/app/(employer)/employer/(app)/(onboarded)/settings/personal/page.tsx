// FILE: settings/personal/page.tsx
import type { Metadata } from 'next';
import PersonalSettingsClient from './PersonalSettingsClient';

export const metadata: Metadata = {
  title: 'Personal | JobMesh Employer',
  robots: { index: false },
};

export default function PersonalSettingsPage() {
  return <PersonalSettingsClient />;
}
