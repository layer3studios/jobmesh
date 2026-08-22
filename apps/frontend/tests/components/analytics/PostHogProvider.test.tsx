import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { AnalyticsConsent } from '@/lib/analytics-consent';

// Controllable consent value + posthog helper spies.
let consentValue: AnalyticsConsent = 'pending';
const optOut = vi.fn();

vi.mock('@/hooks/useAnalyticsConsent', () => ({
  useAnalyticsConsent: () => ({
    consent: consentValue,
    isBannerOpen: false,
    grant: vi.fn(),
    decline: vi.fn(),
    openPreferences: vi.fn(),
  }),
}));

vi.mock('@/lib/analytics-consent', () => ({
  hydrateAnalyticsConsent: vi.fn(),
}));

const initPostHog = vi.fn();
const resetUser = vi.fn();
vi.mock('@/lib/posthog', () => ({
  initPostHog: () => initPostHog(),
  getPostHogClient: () => ({ opt_out_capturing: optOut }),
  resetUser: () => resetUser(),
}));

import PostHogProvider from '@/components/analytics/PostHogProvider';

describe('PostHogProvider', () => {
  beforeEach(() => {
    consentValue = 'pending';
    vi.clearAllMocks();
  });

  it('renders children unchanged', () => {
    render(<PostHogProvider><div data-testid="child">hi</div></PostHogProvider>);
    expect(screen.getByTestId('child').textContent).toBe('hi');
  });

  it('does NOT init PostHog before consent is granted', () => {
    consentValue = 'pending';
    render(<PostHogProvider><span /></PostHogProvider>);
    expect(initPostHog).not.toHaveBeenCalled();
  });

  it('does NOT init PostHog when consent is declined', () => {
    consentValue = 'declined';
    render(<PostHogProvider><span /></PostHogProvider>);
    expect(initPostHog).not.toHaveBeenCalled();
  });

  it('inits PostHog once consent is granted', () => {
    consentValue = 'granted';
    render(<PostHogProvider><span /></PostHogProvider>);
    expect(initPostHog).toHaveBeenCalledTimes(1);
  });

  it('opts out + resets when consent is revoked after having been granted', () => {
    consentValue = 'granted';
    const { rerender } = render(<PostHogProvider><span /></PostHogProvider>);
    expect(initPostHog).toHaveBeenCalledTimes(1);

    consentValue = 'declined';
    rerender(<PostHogProvider><span data-x /></PostHogProvider>);
    expect(optOut).toHaveBeenCalledTimes(1);
    expect(resetUser).toHaveBeenCalledTimes(1);
  });
});
