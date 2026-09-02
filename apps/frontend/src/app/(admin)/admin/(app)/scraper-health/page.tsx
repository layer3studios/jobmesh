// FILE: admin/scraper-health/page.tsx
// Scraper health dashboard. Client-rendered: the run history and the
// isScraping lock both move while the page is open, so an SSR snapshot would
// be stale on arrival.
import type { Metadata } from 'next';
import ScraperHealthClient from './ScraperHealthClient';

export const metadata: Metadata = {
  title: 'Scraper Health · JobMesh Admin',
  robots: { index: false, follow: false },
};

export default function AdminScraperHealthPage() {
  return <ScraperHealthClient />;
}
