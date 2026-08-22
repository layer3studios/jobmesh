'use client';
// FILE: src/components/employer/Breadcrumbs.tsx
// Navigation path shown above page titles (replaces the old "EMPLOYER" label).
// Every item but the last links to its level; the last is the current page.
//
// The trail reflects the actual navigation PATH, not just the route hierarchy:
// when the caller arrived via `?from=dashboard` the root segment becomes
// "Dashboard" instead of the route-derived "Jobs". Reading the param (rather
// than in-memory state) keeps the trail correct across a refresh.

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { parseNavOrigin, originCrumb } from '@/lib/nav-origin';

export interface BreadcrumbItem { label: string; href?: string }

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
    <nav aria-label="Breadcrumb" style={{ marginBottom: 6 }}>
      <ol style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', listStyle: 'none', margin: 0, padding: 0, fontSize: 13 }}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {index > 0 && <span aria-hidden style={{ color: 'var(--ink-faint)' }}>/</span>}
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="breadcrumb-link"
                  style={{ color: 'var(--ink-2)', textDecoration: 'none' }}
                  onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined} style={{ color: isLast ? 'var(--ink)' : 'var(--ink-2)' }}>
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
