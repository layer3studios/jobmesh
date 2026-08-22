// FILE: settings/branding/page.tsx
import type { Metadata } from 'next';
import BrandingClient from './BrandingClient';

export const metadata: Metadata = {
  title: 'Branding | JobMesh Employer',
  robots: { index: false },
};

export default function BrandingSettingsPage() {
  return <BrandingClient />;
}
