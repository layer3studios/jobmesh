// FILE: settings/danger/page.tsx
import type { Metadata } from 'next';
import DangerZoneClient from './DangerZoneClient';

export const metadata: Metadata = {
  title: 'Danger zone | JobMesh Employer',
  robots: { index: false },
};

export default function DangerZonePage() {
  return <DangerZoneClient />;
}
