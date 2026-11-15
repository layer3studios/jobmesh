import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// posthog-js is mocked; each vi.resetModules() re-runs this factory, giving a fresh
// spy set so module-level init state (hasInitialized) is isolated per test.
vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    debug: vi.fn(),
    opt_out_capturing: vi.fn(),
  },
}));

type PosthogModule = typeof import('@/lib/posthog');

async function loadFresh(key: string | undefined, host: string | undefined) {
  vi.resetModules();
  if (key === undefined) vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', '');
  else vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', key);
  if (host === undefined) vi.stubEnv('NEXT_PUBLIC_POSTHOG_HOST', '');
  else vi.stubEnv('NEXT_PUBLIC_POSTHOG_HOST', host);
  // initPostHog now refuses to run on a non-production host (lib/internal-traffic.ts),
  // and jsdom serves these tests from localhost. Naming localhost as the allowed
  // analytics host exercises the real guard rather than mocking it away.
  vi.stubEnv('NEXT_PUBLIC_ANALYTICS_HOSTS', 'localhost');

  const posthog = (await import('posthog-js')).default;
  const mod: PosthogModule = await import('@/lib/posthog');
  return { posthog, mod };
}

const KEY = 'phc_test_key';
const HOST = 'https://eu.i.posthog.com';

describe('lib/posthog', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllEnvs());

  it('initPostHog is idempotent — calling twice inits exactly once', async () => {
    const { posthog, mod } = await loadFresh(KEY, HOST);
    mod.initPostHog();
    mod.initPostHog();
    expect(posthog.init).toHaveBeenCalledTimes(1);
  });

  it('initPostHog passes consent-safe options (autocapture on, masking, web vitals)', async () => {
    const { posthog, mod } = await loadFresh(KEY, HOST);
    mod.initPostHog();
    const [token, options] = (posthog.init as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(token).toBe(KEY);
    // The regression this guards: `false` lost the entry pageview for every new
    // visitor (consent is granted after load, so a manual capture had already
    // no-oped), and `true` would miss App Router client-side navigations.
    expect(options.capture_pageview).toBe('history_change');
    expect(options.capture_pageleave).toBe(true);
    expect(options.capture_performance).toEqual({ web_vitals: true, web_vitals_attribution: true });
    expect(options.person_profiles).toBe('identified_only');
    expect(options.session_recording.maskAllInputs).toBe(true);
    expect(options.session_recording.maskTextSelector).toBe('[data-ph-mask]');
  });

  it('initPostHog refuses to run on a host that is not an analytics host', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', KEY);
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_HOST', HOST);
    // jsdom is on localhost; naming only the production host excludes it.
    vi.stubEnv('NEXT_PUBLIC_ANALYTICS_HOSTS', 'jobmesh.in');
    const posthog = (await import('posthog-js')).default;
    const mod: PosthogModule = await import('@/lib/posthog');

    expect(mod.initPostHog()).toBeNull();
    expect(posthog.init).not.toHaveBeenCalled();
  });

  it('initPostHog returns early and does NOT throw when env is missing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { posthog, mod } = await loadFresh(undefined, undefined);
    expect(() => mod.initPostHog()).not.toThrow();
    expect(posthog.init).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledTimes(1);
    // Second missing-env call warns only ONCE total (defensive-warn is deduped).
    mod.initPostHog();
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('getPostHogClient returns null before init, the client after', async () => {
    const { mod } = await loadFresh(KEY, HOST);
    expect(mod.getPostHogClient()).toBeNull();
    mod.initPostHog();
    expect(mod.getPostHogClient()).not.toBeNull();
  });

  // capturePageView is gone on purpose: the SDK owns pageviews now, and a manual
  // capture next to 'history_change' double-counts every navigation. This asserts
  // the helper stays gone, so nobody reintroduces the double count.
  it('exposes no manual pageview helper — the SDK owns pageviews', async () => {
    const { mod } = await loadFresh(KEY, HOST);
    expect('capturePageView' in mod).toBe(false);
  });

  it('identifyUser and resetUser are no-ops before init', async () => {
    const { posthog, mod } = await loadFresh(KEY, HOST);
    mod.identifyUser('user-1', { role: 'seeker' });
    mod.resetUser();
    expect(posthog.identify).not.toHaveBeenCalled();
    expect(posthog.reset).not.toHaveBeenCalled();
  });

  it('identifyUser and resetUser proxy to the client after init', async () => {
    const { posthog, mod } = await loadFresh(KEY, HOST);
    mod.initPostHog();
    mod.identifyUser('user-1', { role: 'seeker' });
    mod.resetUser();
    expect(posthog.identify).toHaveBeenCalledWith('user-1', { role: 'seeker' });
    expect(posthog.reset).toHaveBeenCalledTimes(1);
  });
});
