import { describe, it, expect } from 'vitest';
import {
  validateSubmissionLink, validateGithubProfile, validateLinkedinProfile, isPrivateByDefaultHost,
} from '@/components/apply/assignment-validation';

describe('validateSubmissionLink', () => {
  it('accepts an https URL', () => {
    expect(validateSubmissionLink('https://github.com/asha/take-home')).toBeNull();
  });

  it('ignores an empty row', () => {
    expect(validateSubmissionLink('')).toBeNull();
    expect(validateSubmissionLink('   ')).toBeNull();
  });

  // https-only is one check that rejects every dangerous scheme at once.
  it.each([
    ['http://example.com/work'],
    ['javascript:alert(1)'],
    ['data:text/html,<script>alert(1)</script>'],
    ['not a url'],
  ])('rejects %s', (value) => {
    expect(validateSubmissionLink(value)).toBeTruthy();
  });
});

describe('validateGithubProfile', () => {
  it('accepts a profile URL with no hint', () => {
    expect(validateGithubProfile('https://github.com/asha')).toEqual({ error: null, hint: null });
  });

  // Rule 11 — a repo path is a NUDGE, never a rejection. The form still submits.
  it('accepts github.com/user/repo and returns a HINT, not an error', () => {
    const result = validateGithubProfile('https://github.com/asha/take-home');
    expect(result.error).toBeNull();
    expect(result.hint).toBeTruthy();
    expect(result.hint).toMatch(/repositor/i);
  });

  it('treats blank as valid and silent', () => {
    expect(validateGithubProfile('')).toEqual({ error: null, hint: null });
  });

  it.each([
    ['https://github.com'],
    ['http://github.com/asha'],
    ['https://gitlab.com/asha'],
    ['https://github.com.evil.test/asha'],
  ])('rejects %s', (value) => {
    expect(validateGithubProfile(value).error).toBeTruthy();
  });
});

describe('validateLinkedinProfile', () => {
  // ENDS-WITH linkedin.com, not equality with www: Indian candidates routinely copy
  // their URL from the in. regional site.
  it.each([
    ['https://in.linkedin.com/in/asha'],
    ['https://uk.linkedin.com/in/asha'],
    ['https://www.linkedin.com/in/asha'],
    ['https://linkedin.com/in/asha'],
  ])('accepts %s', (value) => {
    expect(validateLinkedinProfile(value)).toBeNull();
  });

  it.each([
    ['https://lnkd.in/abc123'],
    ['https://www.linkedin.com/company/acme'],
    ['https://www.linkedin.com/school/iitb'],
    ['https://www.linkedin.com/posts/asha-activity-123'],
    ['https://www.linkedin.com/jobs/view/123'],
    ['https://www.linkedin.com/feed'],
    ['https://linkedin.com.evil.test/in/asha'],
    ['http://www.linkedin.com/in/asha'],
  ])('rejects %s', (value) => {
    expect(validateLinkedinProfile(value)).toBeTruthy();
  });

  it('treats blank as valid', () => {
    expect(validateLinkedinProfile('')).toBeNull();
  });
});

describe('isPrivateByDefaultHost', () => {
  it.each([
    ['https://github.com/asha/take-home'],
    ['https://gitlab.com/asha/work'],
    ['https://drive.google.com/file/d/abc'],
    ['https://www.notion.so/page'],
    ['https://figma.com/file/abc'],
  ])('flags %s', (value) => {
    expect(isPrivateByDefaultHost(value)).toBe(true);
  });

  it('does not flag an ordinary site', () => {
    expect(isPrivateByDefaultHost('https://asha.dev/take-home')).toBe(false);
  });
});
