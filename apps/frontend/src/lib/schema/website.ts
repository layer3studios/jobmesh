// JSON-LD WebSite + SearchAction builder (SEO-PLAN §2). Pure function → plain
// object, same shape/override convention as buildOrganizationSchema.
//
// The SearchAction declares /jobs?q={search_term_string} as the site's search
// endpoint — the same param the jobs Dashboard reads — which is what makes a
// sitelinks searchbox eligible in Google results.
import { SITE_URL, absoluteUrl } from '../site-url';
import { BRAND } from '../../theme/brand';

export interface WebSiteSchemaInput {
  name?: string;
  description?: string;
  /** Path that performs a search. `{search_term_string}` is substituted by Google. */
  searchPath?: string;
}

export function buildWebSiteSchema(input: WebSiteSchemaInput = {}) {
  const searchPath = input.searchPath ?? '/jobs?q={search_term_string}';
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: input.name ?? BRAND.appName,
    url: SITE_URL,
    description: input.description ?? BRAND.description,
    inLanguage: 'en-IN',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: absoluteUrl(searchPath),
      },
      // Schema.org requires this exact hyphenated key.
      'query-input': 'required name=search_term_string',
    },
  };
}
