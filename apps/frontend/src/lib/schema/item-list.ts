// JSON-LD ItemList builder (SEO-PLAN §2 — jobs list, company directory). Pure.
import { absoluteUrl } from '../site-url';

export interface ItemListEntry {
  /** Absolute or site-relative URL for the list item. */
  path: string;
  name?: string;
}

export function buildItemListSchema(entries: ItemListEntry[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: entries.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: entry.path.startsWith('http') ? entry.path : absoluteUrl(entry.path),
      ...(entry.name ? { name: entry.name } : {}),
    })),
  };
}
