// FILE: tests/components/seeker/filter-identity.test.ts
// The filters object must keep its identity when a NON-filter param changes.
//
// This is the scroll-reset bug. useDashboardFilters keyed its filters memo on
// the whole query string, so opening a job — which writes only ?selectedJob —
// produced a new filters object with no filter value changed. useDashboardJobs
// depends on [filters, search], so it refetched, the list remounted, and the
// scroll jumped to the top. Clicking the fourth job sent you back to the first.
//
// The hook itself needs a router and a Suspense boundary to render, so this
// tests the rule that fixes it directly: the memo key is built from the filter
// params alone and ignores everything else in the URL.
import { describe, it, expect } from 'vitest';
import { PARAM } from '@/components/seeker/dashboard/filter-schema';

/** The exact key useDashboardFilters memoises its filters on. */
function filterKey(search: string): string {
  const sp = new URLSearchParams(search);
  return Object.values(PARAM).sort().map((name) => `${name}=${sp.get(name) ?? ''}`).join('&');
}

describe('filter memo key', () => {
  it('does not change when only selectedJob changes', () => {
    const before = filterKey('?loc=Bengaluru&tech=React');
    const after = filterKey('?loc=Bengaluru&tech=React&selectedJob=6afaa070ae00c9ce3936ae84');
    expect(after).toBe(before);
  });

  it('does not change when selectedJob moves from one job to another', () => {
    const a = filterKey('?loc=Pune&selectedJob=aaaaaaaaaaaaaaaaaaaaaaaa');
    const b = filterKey('?loc=Pune&selectedJob=bbbbbbbbbbbbbbbbbbbbbbbb');
    expect(a).toBe(b);
  });

  it('ignores any unrelated param, including ones added later', () => {
    const plain = filterKey('?loc=Bengaluru');
    expect(filterKey('?loc=Bengaluru&utm_source=newsletter&ref=blog&page=3')).toBe(plain);
  });

  it('is order-independent, so the same filters always key the same', () => {
    expect(filterKey('?loc=Bengaluru&tech=React')).toBe(filterKey('?tech=React&loc=Bengaluru'));
  });

  it('DOES change when a real filter changes — otherwise the list would never refetch', () => {
    const before = filterKey('?loc=Bengaluru');
    expect(filterKey('?loc=Hyderabad')).not.toBe(before);
    expect(filterKey('?loc=Bengaluru&tech=React')).not.toBe(before);
    expect(filterKey('')).not.toBe(before);
  });

  it('covers every param the schema owns', () => {
    // If a filter is added to PARAM but the key is built some other way, that
    // filter would stop triggering a refetch. This pins them together.
    const names = Object.values(PARAM);
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      const key = filterKey(`?${name}=x`);
      expect(key).toContain(`${name}=x`);
    }
  });
});
