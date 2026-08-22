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

  it('initPostHog passes consent-safe options (autocapture on, capture_pageview off, masking)', async () => {
    const { posthog, mod } = await loadFresh(KEY, HOST);
    mod.initPostHog();
    const [token, options] = (posthog.init as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(token).toBe(KEY);
    expect(options.capture_pageview).toBe(false);
    expect(options.person_profiles).toBe('identified_only');
    expect(options.session_recording.maskAllInputs).toBe(true);
    expect(options.session_recording.maskTextSelector).toBe('[data-ph-mask]');
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

  it('capturePageView is a no-op before init', async () => {
    const { posthog, mod } = await loadFresh(KEY, HOST);
    mod.capturePageView('/jobs');
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it('capturePageView fires $pageview with a composed url after init', async () => {
    const { posthog, mod } = await loadFresh(KEY, HOST);
    mod.initPostHog();
    mod.capturePageView('/jobs', 'q=react');
    expect(posthog.capture).toHaveBeenCalledWith('$pageview', { $current_url: '/jobs?q=react' });
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
