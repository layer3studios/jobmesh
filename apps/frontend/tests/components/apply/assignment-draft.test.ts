import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DRAFT_TTL_MS, draftKey, readDraft, writeDraft, clearDraft } from '@/components/apply/assignment-draft';
import type { DraftPayload } from '@/components/apply/assignment-draft';

const JOB = 'job-1';
const NOW = 1_700_000_000_000;

const payload: Omit<DraftPayload, 'savedAt'> = {
  assignmentId: 'asg-1',
  fields: {
    firstName: 'Asha', lastName: 'Rao', email: 'asha@example.com', phone: '9876543210',
    coverNote: 'hello', links: ['https://github.com/asha/take-home'], github: '', linkedin: '', notes: 'notes',
  },
  files: [{ fileId: 'tok-1', originalName: 'design.pdf' }],
};

describe('assignment-draft', () => {
  beforeEach(() => { localStorage.clear(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('round-trips a draft', () => {
    writeDraft(JOB, payload, NOW);
    const draft = readDraft(JOB, NOW + 1000);
    expect(draft?.assignmentId).toBe('asg-1');
    expect(draft?.fields.email).toBe('asha@example.com');
    expect(draft?.files).toEqual([{ fileId: 'tok-1', originalName: 'design.pdf' }]);
    expect(draft?.savedAt).toBe(NOW);
  });

  it('the TTL is exactly 7 days — it MUST equal the backend STAGING_TTL_MS', () => {
    expect(DRAFT_TTL_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('returns null for a draft older than the TTL', () => {
    writeDraft(JOB, payload, NOW);
    expect(readDraft(JOB, NOW + DRAFT_TTL_MS + 1)).toBeNull();
  });

  it('still restores a draft one millisecond inside the TTL', () => {
    writeDraft(JOB, payload, NOW);
    expect(readDraft(JOB, NOW + DRAFT_TTL_MS - 1)).not.toBeNull();
  });

  it('ignores a draft written under a different key version', () => {
    localStorage.setItem(`jm_apply_draft_v0_${JOB}`, JSON.stringify({ savedAt: NOW, ...payload }));
    expect(readDraft(JOB, NOW)).toBeNull();
    expect(draftKey(JOB)).toBe(`jm_apply_draft_v1_${JOB}`);
  });

  it('drafts are per-posting — another job never sees this one', () => {
    writeDraft(JOB, payload, NOW);
    expect(readDraft('job-2', NOW)).toBeNull();
  });

  it('returns null (and does not throw) on corrupt JSON', () => {
    localStorage.setItem(draftKey(JOB), '{not json');
    expect(() => readDraft(JOB, NOW)).not.toThrow();
    expect(readDraft(JOB, NOW)).toBeNull();
  });

  it('returns null on a well-formed but wrong-shaped payload', () => {
    localStorage.setItem(draftKey(JOB), JSON.stringify({ hello: 'world' }));
    expect(readDraft(JOB, NOW)).toBeNull();
  });

  it('returns null for a draft with no assignmentId — provenance is required', () => {
    const { assignmentId, ...withoutAssignment } = { savedAt: NOW, ...payload };
    expect(assignmentId).toBe('asg-1');
    localStorage.setItem(draftKey(JOB), JSON.stringify(withoutAssignment));
    expect(readDraft(JOB, NOW)).toBeNull();
  });

  it('clearDraft removes the draft', () => {
    writeDraft(JOB, payload, NOW);
    clearDraft(JOB);
    expect(readDraft(JOB, NOW)).toBeNull();
  });

  // ── Storage failure (rule 8) ────────────────────────────────────────────────
  it('writeDraft does not throw when setItem throws (quota / private browsing)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('QuotaExceededError'); });
    expect(() => writeDraft(JOB, payload, NOW)).not.toThrow();
  });

  it('readDraft returns null when getItem throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('SecurityError'); });
    expect(readDraft(JOB, NOW)).toBeNull();
  });

  it('clearDraft does not throw when removeItem throws', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('SecurityError'); });
    expect(() => clearDraft(JOB)).not.toThrow();
  });
});
