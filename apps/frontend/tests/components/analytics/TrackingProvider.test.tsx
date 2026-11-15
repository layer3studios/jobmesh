import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { AnalyticsConsent } from '@/lib/analytics-consent';

// Controllable consent value + spies for all three trackers.
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

const startGoogleTagManager = vi.fn();
const startClarity = vi.fn();
const stopTagTracking = vi.fn();
vi.mock('@/lib/tracking', () => ({
  startGoogleTagManager: () => startGoogleTagManager(),
  startClarity: () => startClarity(),
  stopTagTracking: () => stopTagTracking(),
}));

const applyInternalFlagFromUrl = vi.fn();
vi.mock('@/lib/internal-traffic', () => ({
  applyInternalFlagFromUrl: () => applyInternalFlagFromUrl(),
}));

import TrackingProvider from '@/components/analytics/TrackingProvider';

describe('TrackingProvider', () => {
  beforeEach(() => {
    consentValue = 'pending';
    vi.clearAllMocks();
  });

  it('renders children unchanged', () => {
    render(<TrackingProvider><div data-testid="child">hi</div></TrackingProvider>);
    expect(screen.getByTestId('child').textContent).toBe('hi');
  });

  it('starts NO tracker before consent is granted', () => {
    consentValue = 'pending';
    render(<TrackingProvider><span /></TrackingProvider>);
    expect(initPostHog).not.toHaveBeenCalled();
    expect(startGoogleTagManager).not.toHaveBeenCalled();
    expect(startClarity).not.toHaveBeenCalled();
  });

  it('starts NO tracker when consent is declined', () => {
    consentValue = 'declined';
    render(<TrackingProvider><span /></TrackingProvider>);
    expect(initPostHog).not.toHaveBeenCalled();
    expect(startGoogleTagManager).not.toHaveBeenCalled();
    expect(startClarity).not.toHaveBeenCalled();
  });

  it('starts all three trackers once consent is granted', () => {
    consentValue = 'granted';
    render(<TrackingProvider><span /></TrackingProvider>);
    expect(initPostHog).toHaveBeenCalledTimes(1);
    expect(startGoogleTagManager).toHaveBeenCalledTimes(1);
    expect(startClarity).toHaveBeenCalledTimes(1);
  });

  it('applies the ?jm_internal flag on mount, before any tracker could start', () => {
    consentValue = 'granted';
    render(<TrackingProvider><span /></TrackingProvider>);
    expect(applyInternalFlagFromUrl).toHaveBeenCalledTimes(1);
  });

  it('stops every tracker when consent is revoked after having been granted', () => {
    consentValue = 'granted';
    const { rerender } = render(<TrackingProvider><span /></TrackingProvider>);
    expect(initPostHog).toHaveBeenCalledTimes(1);

    consentValue = 'declined';
    rerender(<TrackingProvider><span data-x /></TrackingProvider>);
    expect(optOut).toHaveBeenCalledTimes(1);
    expect(resetUser).toHaveBeenCalledTimes(1);
    expect(stopTagTracking).toHaveBeenCalledTimes(1);
  });
});
