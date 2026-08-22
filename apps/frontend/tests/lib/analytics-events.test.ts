import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Control the PostHog client the event layer talks to.
let client: { capture: ReturnType<typeof vi.fn> } | null = null;
vi.mock('@/lib/posthog', () => ({
  getPostHogClient: () => client,
}));

import { trackEvent } from '@/lib/analytics-events';
import type { EventPropertyMap } from '@/lib/analytics-events';
import { scoreToDecile } from '@/lib/score-decile';

const EVENTS_SOURCE = readFileSync(resolve(process.cwd(), 'src/lib/analytics-events.ts'), 'utf8');

describe('lib/analytics-events — trackEvent', () => {
  beforeEach(() => { client = null; vi.clearAllMocks(); });

  it('no-ops when PostHog is not initialised (no consent)', () => {
    client = null;
    expect(() => trackEvent('job_viewed', { jobId: 'j1', fromRoute: '(direct)' })).not.toThrow();
    // Nothing to assert beyond "did not throw / no client" — there is no client to call.
  });

  it('captures the event with properties when the client exists', () => {
    const capture = vi.fn();
    client = { capture };
    trackEvent('apply_started', { jobId: 'j1', companyId: 'acme', applyMethod: 'public' });
    expect(capture).toHaveBeenCalledWith('apply_started', { jobId: 'j1', companyId: 'acme', applyMethod: 'public' });
  });

  it('never throws even if capture throws', () => {
    client = { capture: vi.fn(() => { throw new Error('boom'); }) };
    expect(() => trackEvent('seeker_logged_out', { fromRoute: '/jobs' })).not.toThrow();
  });

  it('strips personal-data-shaped keys defensively before sending', () => {
    const capture = vi.fn();
    client = { capture };
    // Off-schema object with PII keys — the generic sink must drop them.
    trackEvent('job_viewed', { jobId: 'j1', fromRoute: '(direct)', email: 'x@y.z', phone: '999', name: 'Ada' } as never);
    const sent = capture.mock.calls[0][1];
    expect(sent.jobId).toBe('j1');
    expect(sent.email).toBeUndefined();
    expect(sent.phone).toBeUndefined();
    expect(sent.name).toBeUndefined();
  });
});

// ─── Take-home assignment events (7b + Chunk 9) ─────────────────────────────

/** Every assignment event the feature added, with a representative payload. */
const ASSIGNMENT_EVENTS = {
  assignment_apply_form_viewed: { postingId: 'p1', assignmentId: 'a1' },
  assignment_draft_saved: { postingId: 'p1' },
  assignment_draft_restored: { postingId: 'p1', fileCount: 1, expiredFileCount: 0 },
  assignment_file_upload_failed: { postingId: 'p1', reason: 'FILE_TOO_LARGE' },
  assignment_created: { companyId: 'c1', assignmentId: 'a1', estimatedHours: 3 },
  assignment_cloned: { companyId: 'c1', assignmentId: 'a1' },
  assignment_archived: { companyId: 'c1', assignmentId: 'a1' },
  assignment_attached: { companyId: 'c1', postingId: 'p1', assignmentId: 'a1' },
  assignment_detached: { companyId: 'c1', postingId: 'p1', applicationCount: 7 },
  assignment_review_submitted: { companyId: 'c1', postingId: 'p1', overallScore: 4, passesBar: true },
  assignment_review_edited: { companyId: 'c1', postingId: 'p1' },
  assignment_review_conflicted: { companyId: 'c1', postingId: 'p1', resolution: 'replaced' as const },
} as const;

describe('assignment events — registration', () => {
  beforeEach(() => { client = null; vi.clearAllMocks(); });

  // The map is the typed source of truth: an unregistered event does not compile.
  // Re-asserted against the source so a deletion is caught even if its call site
  // goes with it.
  it('every assignment event is declared in EventPropertyMap', () => {
    for (const name of Object.keys(ASSIGNMENT_EVENTS)) {
      expect(EVENTS_SOURCE).toMatch(new RegExp(`\\n\\s*${name}\\s*:`));
    }
  });

  it('each dispatches under its own name with its own payload', () => {
    const capture = vi.fn();
    client = { capture };
    for (const [name, properties] of Object.entries(ASSIGNMENT_EVENTS)) {
      capture.mockClear();
      trackEvent(name as keyof EventPropertyMap, properties as never);
      expect(capture).toHaveBeenCalledWith(name, properties);
    }
  });
});

describe('assignment events — ids and numbers only', () => {
  // The PII blocklist in posthog.ts is a backstop, not the design.
  const FORBIDDEN_NAME = /^(url|email|title|name|filename|notes|text|summary|description|link|links)$/i;

  it('no property is NAMED like free text or a person', () => {
    for (const [event, properties] of Object.entries(ASSIGNMENT_EVENTS)) {
      for (const key of Object.keys(properties)) {
        expect(FORBIDDEN_NAME.test(key), `${event}.${key} is a forbidden property name`).toBe(false);
      }
    }
  });

  it('every string-valued property is an id or a stable machine code', () => {
    const ALLOWED_STRING_KEYS = /(Id$|^reason$|^resolution$)/;
    for (const [event, properties] of Object.entries(ASSIGNMENT_EVENTS)) {
      for (const [key, value] of Object.entries(properties)) {
        if (typeof value !== 'string') continue;
        expect(ALLOWED_STRING_KEYS.test(key), `${event}.${key} carries free text`).toBe(true);
      }
    }
  });

  // Assignment titles are employer-authored content and must never be an event
  // property. This fails before such data could leave a browser.
  it('the assignment block of the schema declares no title/email/filename', () => {
    const block = EVENTS_SOURCE.slice(EVENTS_SOURCE.indexOf('assignment_created'));
    expect(block).not.toMatch(/\btitle\s*:/);
    expect(block).not.toMatch(/\bemail\s*:/);
    expect(block).not.toMatch(/\bfilename\s*:/i);
  });
});

describe('the abandonment ratio needs BOTH populations', () => {
  beforeEach(() => { client = null; vi.clearAllMocks(); });

  it('apply_started carries hasAssignment — it is the form-viewed counter for both', () => {
    const capture = vi.fn();
    client = { capture };
    trackEvent('apply_started', { jobId: 'j1', companyId: 'acme', applyMethod: 'public', hasAssignment: true });
    expect(capture).toHaveBeenCalledWith('apply_started', expect.objectContaining({ hasAssignment: true }));
  });

  it('apply_submitted carries the matching flag, plus 7b\'s extension', () => {
    const capture = vi.fn();
    client = { capture };
    trackEvent('apply_submitted', {
      jobId: 'j1', applyMethod: 'public', hasResume: true, hasCoverNote: false,
      hasAssignment: true, linkCount: 2, fileCount: 1, hasGithubProfile: true, hasLinkedinProfile: false,
    });
    expect(capture).toHaveBeenCalledWith('apply_submitted', expect.objectContaining({
      hasAssignment: true, linkCount: 2, fileCount: 1, hasGithubProfile: true, hasLinkedinProfile: false,
    }));
  });
});

describe('lib/score-decile — scoreToDecile', () => {
  it('returns unscored for null/undefined', () => {
    expect(scoreToDecile(null)).toBe('unscored');
    expect(scoreToDecile(undefined)).toBe('unscored');
  });
  it('buckets a score into its decile', () => {
    expect(scoreToDecile(0)).toBe(0);
    expect(scoreToDecile(45)).toBe(4);
    expect(scoreToDecile(99)).toBe(9);
    expect(scoreToDecile(100)).toBe(9); // clamped
  });
});
