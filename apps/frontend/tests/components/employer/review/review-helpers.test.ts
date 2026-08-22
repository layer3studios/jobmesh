import { describe, it, expect } from 'vitest';
import {
  assignmentPillState, matchesAssignmentFilter, SCORE_ANCHORS, anchorFor,
  formatAnchorLine, parseAssignmentFilter, formatStatsLine, formatRelativeTime,
} from '@/components/employer/jobs/parts/review-helpers';
import type { Applicant, ApplicantAssignmentSummary } from '@/types/employer-applicants';

function summary(overrides: Partial<ApplicantAssignmentSummary> = {}): ApplicantAssignmentSummary {
  return {
    submissionId: 's1', submittedAt: '2026-08-01T00:00:00.000Z',
    linkCount: 1, fileCount: 0, review: null,
    ...overrides,
  };
}

const row = (assignment: ApplicantAssignmentSummary | null | undefined) =>
  ({ assignment } as Pick<Applicant, 'assignment'>);

describe('assignmentPillState', () => {
  it('reports "No submission" when the candidate submitted nothing', () => {
    expect(assignmentPillState(null)).toEqual({ label: 'No submission', variant: 'neutral', isEmpty: true });
  });

  it('reports "No submission" for a plain posting (key absent)', () => {
    expect(assignmentPillState(undefined).label).toBe('No submission');
  });

  it('reports "Not reviewed" for a submission nobody has scored', () => {
    const state = assignmentPillState(summary());
    expect(state.label).toBe('Not reviewed');
    expect(state.isEmpty).toBe(false);
  });

  it('reports a passing score', () => {
    const state = assignmentPillState(summary({ review: { overallScore: 4, passesBar: true, reviewedAt: null } }));
    expect(state.label).toBe('4/5 · Passed');
    expect(state.variant).toBe('success');
  });

  it('reports a failing score', () => {
    const state = assignmentPillState(summary({ review: { overallScore: 2, passesBar: false, reviewedAt: null } }));
    expect(state.label).toBe('2/5 · Failed');
    expect(state.variant).toBe('danger');
  });
});

describe('matchesAssignmentFilter', () => {
  const unreviewed = row(summary());
  const passed = row(summary({ review: { overallScore: 4, passesBar: true, reviewedAt: null } }));
  const failed = row(summary({ review: { overallScore: 2, passesBar: false, reviewedAt: null } }));
  const noSubmission = row(null);

  it('the All filter (null) keeps everything, including rows with no submission', () => {
    for (const candidate of [unreviewed, passed, failed, noSubmission]) {
      expect(matchesAssignmentFilter(candidate, null)).toBe(true);
    }
  });

  it('reviewed keeps only scored rows', () => {
    expect(matchesAssignmentFilter(passed, 'reviewed')).toBe(true);
    expect(matchesAssignmentFilter(failed, 'reviewed')).toBe(true);
    expect(matchesAssignmentFilter(unreviewed, 'reviewed')).toBe(false);
  });

  it('not_reviewed keeps only submitted-but-unscored rows', () => {
    expect(matchesAssignmentFilter(unreviewed, 'not_reviewed')).toBe(true);
    expect(matchesAssignmentFilter(passed, 'not_reviewed')).toBe(false);
  });

  it('passed and failed split on passesBar', () => {
    expect(matchesAssignmentFilter(passed, 'passed')).toBe(true);
    expect(matchesAssignmentFilter(failed, 'passed')).toBe(false);
    expect(matchesAssignmentFilter(failed, 'failed')).toBe(true);
    expect(matchesAssignmentFilter(passed, 'failed')).toBe(false);
    expect(matchesAssignmentFilter(unreviewed, 'failed')).toBe(false);
  });

  // A queue of "things I can act on" must not include people with nothing to read.
  it('a row with NO submission is excluded by all four filters', () => {
    for (const filter of ['reviewed', 'not_reviewed', 'passed', 'failed'] as const) {
      expect(matchesAssignmentFilter(noSubmission, filter)).toBe(false);
    }
  });
});

describe('score anchors', () => {
  it('has exactly five points, 1 through 5', () => {
    expect(SCORE_ANCHORS.map((anchor) => anchor.value)).toEqual([1, 2, 3, 4, 5]);
  });

  // An adjective alone is a second abstract category, which is the problem anchoring
  // is meant to solve. Every point carries an observable line.
  it('every point has a concrete description, not just an adjective', () => {
    for (const anchor of SCORE_ANCHORS) {
      expect(anchor.label.length).toBeGreaterThan(0);
      expect(anchor.description.length).toBeGreaterThan(10);
      expect(anchor.description).not.toBe(anchor.label);
    }
  });

  it('matches the specified scale', () => {
    expect(SCORE_ANCHORS[0]).toEqual({ value: 1, label: 'Poor', description: 'Incomplete, or does not run' });
    expect(SCORE_ANCHORS[2].description).toBe('Does what was asked, competently');
    expect(SCORE_ANCHORS[4].description).toBe("Would raise the team's average");
  });

  it('anchorFor resolves a score and rejects out-of-range values', () => {
    expect(anchorFor(3)?.label).toBe('Meets bar');
    expect(anchorFor(0)).toBeNull();
    expect(anchorFor(6)).toBeNull();
    expect(anchorFor(null)).toBeNull();
  });

  it('formatAnchorLine renders value, label and description', () => {
    expect(formatAnchorLine(4)).toBe('4 · Strong — Complete, with good judgement in the details');
    expect(formatAnchorLine(null)).toBeNull();
  });
});

describe('parseAssignmentFilter', () => {
  it.each(['reviewed', 'not_reviewed', 'passed', 'failed'])('accepts %s', (value) => {
    expect(parseAssignmentFilter(value)).toBe(value);
  });

  it('rejects anything else', () => {
    expect(parseAssignmentFilter('nonsense')).toBeNull();
    expect(parseAssignmentFilter('')).toBeNull();
    expect(parseAssignmentFilter(null)).toBeNull();
  });
});

describe('formatStatsLine', () => {
  // Describes the POSTING, not the view — never "showing 47".
  it('reads as a description of the posting', () => {
    expect(formatStatsLine({ total: 47, reviewed: 31, passing: 12 }))
      .toBe('47 applications · 31 reviewed · 12 passing');
    expect(formatStatsLine({ total: 47, reviewed: 31, passing: 12 })).not.toMatch(/showing/i);
  });

  it('is singular at one application', () => {
    expect(formatStatsLine({ total: 1, reviewed: 0, passing: 0 })).toBe('1 application · 0 reviewed · 0 passing');
  });
});

describe('formatRelativeTime (re-exported, not reimplemented)', () => {
  const now = new Date('2026-08-04T12:00:00.000Z').getTime();

  it('formats minutes, hours and days', () => {
    expect(formatRelativeTime('2026-08-04T11:58:00.000Z', now)).toBe('2m ago');
    expect(formatRelativeTime('2026-08-04T09:00:00.000Z', now)).toBe('3h ago');
    expect(formatRelativeTime('2026-08-02T12:00:00.000Z', now)).toBe('2d ago');
    expect(formatRelativeTime('2026-08-04T11:59:50.000Z', now)).toBe('just now');
  });

  it('degrades on an unparseable date', () => {
    expect(formatRelativeTime('not-a-date', now)).toBe('—');
  });
});
