// FILE: src/app/(seeker)/legal/privacy/page.tsx — DPDP privacy notice. Server
// Component wraps the ported client <Privacy/> (collapsible sections) so metadata
// stays server-side while the full notice ships in the initial HTML (SEO-safe).
import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site-url';
import Privacy from '@/components/seeker/legal/Privacy';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Privacy Notice',
  description: 'How JobMesh handles data under India’s DPDP Act.',
  alternates: { canonical: absoluteUrl('/legal/privacy') },
};

export default function PrivacyPage() {
  return <Privacy />;
}
