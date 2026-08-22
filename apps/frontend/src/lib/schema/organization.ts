// JSON-LD Organization builder (SEO-PLAN §2, D8). Pure function → plain object.
import { SITE_URL, absoluteUrl } from '../site-url';

export interface OrganizationSchemaInput {
  name?: string;
  description?: string;
  logoPath?: string;
  sameAs?: string[];
}

export function buildOrganizationSchema(input: OrganizationSchemaInput = {}) {
  const logoPath = input.logoPath ?? '/og/logo.png';
  const logo = logoPath.startsWith('http') ? logoPath : absoluteUrl(logoPath);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: input.name ?? 'JobMesh',
    url: SITE_URL,
    logo,
    description:
      input.description ??
      'Fresh tech jobs from top Indian companies, updated daily. Direct apply links, no middlemen.',
    sameAs: input.sameAs ?? [],
  };
}
