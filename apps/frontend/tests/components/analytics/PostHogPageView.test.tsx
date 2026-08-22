import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

// Controllable route state + capture spy.
let pathname = '/jobs';
let query = '';

vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams(query),
}));

const capturePageView = vi.fn();
vi.mock('@/lib/posthog', () => ({
  capturePageView: (p: string, q?: string) => capturePageView(p, q),
}));

import PostHogPageView from '@/components/analytics/PostHogPageView';

describe('PostHogPageView', () => {
  beforeEach(() => {
    pathname = '/jobs';
    query = '';
    vi.clearAllMocks();
  });

  it('captures a pageview for the current pathname on mount', () => {
    render(<PostHogPageView />);
    expect(capturePageView).toHaveBeenCalledTimes(1);
    expect(capturePageView).toHaveBeenCalledWith('/jobs', undefined);
  });

  it('passes the query string when searchParams are present', () => {
    query = 'q=react';
    render(<PostHogPageView />);
    expect(capturePageView).toHaveBeenCalledWith('/jobs', 'q=react');
  });

  it('captures again when the pathname changes', () => {
    const { rerender } = render(<PostHogPageView />);
    expect(capturePageView).toHaveBeenCalledTimes(1);

    pathname = '/companies';
    rerender(<PostHogPageView />);
    expect(capturePageView).toHaveBeenCalledTimes(2);
    expect(capturePageView).toHaveBeenLastCalledWith('/companies', undefined);
  });
});
