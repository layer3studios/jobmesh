'use client';
// FILE: src/components/employer/Breadcrumbs.tsx
// Navigation path shown above page titles, set as a mono eyebrow. Every item
// but the last links to its level; the last is the current page.
//
// The trail reflects the actual navigation PATH, not just the route hierarchy:
// when the caller arrived via `?from=dashboard` the root segment becomes
// "Dashboard" instead of the route-derived "Jobs". Reading the param (rather
// than in-memory state) keeps the trail correct across a refresh.

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { parseNavOrigin, originCrumb } from '@/lib/nav-origin';

export interface BreadcrumbItem { label: string; href?: string }

const MONO = 'var(--font-jetbrains-mono), ui-monospace, monospace';

export default function Breadcrumbs({ items: routeItems }: { items: BreadcrumbItem[] }) {
  const searchParams = useSearchParams();
  const origin = parseNavOrigin(searchParams?.get('from'));
  // Only rewrite the ROOT of a multi-level trail — a single item is the current
  // page itself and must never turn into a link to somewhere else.
  const items = origin && routeItems.length > 1
    ? [originCrumb(origin), ...routeItems.slice(1)]
    : routeItems;

  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" style={{ marginBottom: 8 }}>
      <ol style={{
        display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', listStyle: 'none', margin: 0, padding: 0,
        fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {index > 0 && <span aria-hidden style={{ color: 'var(--ink-faint)' }}>/</span>}
              {item.href && !isLast ? (
                <Link href={item.href} className="eb-crumb" style={{ color: 'var(--ink-muted)', textDecoration: 'none' }}>
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} style={{ color: isLast ? 'var(--ink)' : 'var(--ink-muted)' }}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
