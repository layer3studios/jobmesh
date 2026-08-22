// FILE: settings/page.tsx
// The default /employer/settings landing page — Company settings.
import type { Metadata } from 'next';
import CompanySettingsClient from './CompanySettingsClient';

export const metadata: Metadata = {
  title: 'Company | JobMesh Employer',
  robots: { index: false },
};

export default function CompanySettingsPage() {
  return <CompanySettingsClient />;
}
