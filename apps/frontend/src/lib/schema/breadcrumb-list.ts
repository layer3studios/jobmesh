// JSON-LD BreadcrumbList builder (SEO-PLAN §2). Pure function → plain object.
import { absoluteUrl } from '../site-url';

export interface BreadcrumbEntry {
  name: string;
  /** Site-relative path (e.g. '/jobs') or absolute URL. */
  path: string;
}

export function buildBreadcrumbListSchema(entries: BreadcrumbEntry[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: entries.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.name,
      item: entry.path.startsWith('http') ? entry.path : absoluteUrl(entry.path),
    })),
  };
}
