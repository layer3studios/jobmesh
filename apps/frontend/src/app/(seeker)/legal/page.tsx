// FILE: src/app/(seeker)/legal/page.tsx — static legal info. Server Component wraps
// the ported client <Legal/> (collapsible sections) so metadata stays server-side
// while the static text ships in the initial HTML (SEO-safe).
import type { Metadata } from 'next';
import { absoluteUrl } from '@/lib/site-url';
import Legal from '@/components/seeker/legal/Legal';

export const revalidate = 86400; // D_impl_3

export const metadata: Metadata = {
  title: 'Legal information',
  description: 'Legal information for JobMesh — a non-commercial tech-jobs aggregator.',
  alternates: { canonical: absoluteUrl('/legal') },
};

export default function LegalPage() {
  return <Legal />;
}
