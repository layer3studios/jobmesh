// FILE: tests/components/apply/ApplyPageLayout.test.tsx
// Hierarchy and grouping on the apply page: where the preview sits, what the
// fieldsets are, and — the one that matters most — that none of it moved a field.
//
// The tab-order test is the guard rail for the whole change. Grouping fields into
// fieldsets is allowed to change how the form LOOKS and how it is ANNOUNCED; it is
// not allowed to change the order a keyboard walks it in.

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

vi.mock('@/lib/posthog', () => ({ getPostHogClient: () => null }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  // ApplyFormClient reads ?source= to pre-answer the "how did you hear about us" field.
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/api/public-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/public-api')>()),
  submitApplication: vi.fn(),
}));

import ApplyFormClient from '@/components/apply/ApplyFormClient';
import type { PublicAssignment, PublicCompany, PublicJob } from '@/types/public-apply';

const company = { name: 'Acme', slug: 'acme' } as unknown as PublicCompany;
const job = {
  id: 'job-1', slug: 'dev', title: 'Developer', description: 'Build things.',
} as unknown as PublicJob;
const assignment = {
  id: 'asg-1', title: 'Build a rate limiter', estimatedHours: 3,
  publicSummary: 'A small service.', allowedFileTypes: ['pdf'],
} as unknown as PublicAssignment;

function renderAssignmentPosting() {
  return render(
    <ApplyFormClient
      company={company} job={job} companySlug="acme" jobSlug="dev"
      assignment={assignment}
      assignmentPreview={<div data-testid="preview">The task</div>}
    />,
  );
}

function renderPlainPosting() {
  return render(<ApplyFormClient company={company} job={job} companySlug="acme" jobSlug="dev" />);
}

/** DOM order: is `first` genuinely before `second`? */
function isBefore(first: Element, second: Element): boolean {
  return Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);
}

function legends(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('legend')).map((el) => el.textContent?.trim() ?? '');
}

describe('assignment preview placement', () => {
  it('renders the preview BEFORE the job description', () => {
    renderAssignmentPosting();
    const preview = screen.getByTestId('preview');
    const description = screen.getByText('Build things.');
    expect(isBefore(preview, description)).toBe(true);
  });

  it('renders the preview after the job header, not above it', () => {
    renderAssignmentPosting();
    const heading = screen.getByRole('heading', { name: 'Developer' });
    expect(isBefore(heading, screen.getByTestId('preview'))).toBe(true);
  });

  it('plain posting: no preview, and the header still precedes the description', () => {
    renderPlainPosting();
    expect(screen.queryByTestId('preview')).toBeNull();
    const heading = screen.getByRole('heading', { name: 'Developer' });
    expect(isBefore(heading, screen.getByText('Build things.'))).toBe(true);
  });
});

describe('the job description cannot blow out the layout', () => {
  // A real posting (/apply/dalali/tel-chatai) carried an unbroken ~200-char token.
  // A grid child is min-width: auto by default — "never shrink below my content" —
  // so that one token widened the JD track, overlapped the form column and put a
  // horizontal scrollbar on the page.
  const UNBREAKABLE = 'x'.repeat(300);

  it('gives the description container the wrap class', () => {
    render(
      <ApplyFormClient
        company={company}
        job={{ ...job, description: UNBREAKABLE } as unknown as PublicJob}
        companySlug="acme" jobSlug="dev"
      />,
    );
    const description = screen.getByText(UNBREAKABLE);
    expect(description.classList.contains('apply-jd-description')).toBe(true);
  });

  // jsdom/happy-dom do not load the global stylesheet, so the rule itself is
  // asserted against the file on disk — the same approach the existing layout
  // test uses for source-level guarantees.
  it('declares the wrap rule and min-width: 0 in apply.css', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/apply.css'), 'utf8');
    const block = css.slice(css.indexOf('.apply-jd-description'));
    const body = block.slice(0, block.indexOf('}'));
    expect(body).toMatch(/overflow-wrap:\s*(anywhere|break-word)/);
    expect(body).toMatch(/min-width:\s*0/);
  });

  it('keeps min-width: 0 on the JD column itself, so the grid track can shrink', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/apply.css'), 'utf8');
    const block = css.slice(css.indexOf('.apply-jd-column'));
    expect(block.slice(0, block.indexOf('}'))).toMatch(/min-width:\s*0/);
  });
});

describe('form grouping', () => {
  it('renders four fieldsets in order on an assignment posting', () => {
    const { container } = renderAssignmentPosting();
    expect(legends(container)).toEqual(['Your details', 'Resume', 'Your submission', 'Consent']);
  });

  it('renders three fieldsets on a plain posting — no submission group at all', () => {
    const { container } = renderPlainPosting();
    expect(legends(container)).toEqual(['Your details', 'Resume', 'Consent']);
  });

  it('uses real <fieldset> elements, so the grouping is announced and not merely drawn', () => {
    const { container } = renderAssignmentPosting();
    expect(container.querySelectorAll('fieldset').length).toBe(4);
    for (const legend of Array.from(container.querySelectorAll('legend'))) {
      expect(legend.parentElement?.tagName).toBe('FIELDSET');
    }
  });
});

describe('assignment submission prominence', () => {
  it('renders the submission section ABOVE the consent checkbox', () => {
    const { container } = renderAssignmentPosting();
    const submission = Array.from(container.querySelectorAll('legend'))
      .find((el) => el.textContent?.trim() === 'Your submission')?.parentElement as HTMLElement;
    const consent = container.querySelector('input[type="checkbox"]') as HTMLElement;
    expect(submission).toBeTruthy();
    expect(isBefore(submission, consent)).toBe(true);
  });

  it('heads the section with the assignment title', () => {
    renderAssignmentPosting();
    expect(screen.getByRole('heading', { name: 'Build a rate limiter' })).toBeTruthy();
  });

  // B1 has no deadline field. Inventing one — even as a soft hint — would be a
  // promise the data cannot keep.
  it('shows no deadline copy anywhere', () => {
    const { container } = renderAssignmentPosting();
    expect(container.textContent).not.toMatch(/deadline|due by|due date/i);
  });
});

describe('tab order is unchanged', () => {
  // The exact pre-change sequence, captured from the form before any fieldset
  // existed. Grouping wraps these; it must never reorder them.
  const EXPECTED_TAB_ORDER = [
    'First name',
    'Last name',
    'Email',
    'Phone',
    'Choose PDF',
    'Cover note',
  ];

  function focusableLabels(container: HTMLElement): string[] {
    const nodes = Array.from(container.querySelectorAll<HTMLElement>('input, textarea, button'));
    return nodes
      // The honeypot is tabIndex -1 and the hidden file input is not tabbable;
      // neither is part of the keyboard path.
      .filter((node) => node.tabIndex >= 0 && node.getAttribute('type') !== 'file' && !node.hidden)
      .map((node) => {
        const id = node.getAttribute('id');
        const label = id ? container.querySelector(`label[for="${id}"]`) : null;
        return (label?.textContent ?? node.textContent ?? '').replace('*', '').trim();
      });
  }

  it('walks the base fields in exactly the pre-change order on a plain posting', () => {
    const { container } = renderPlainPosting();
    const order = focusableLabels(container);
    expect(order.slice(0, EXPECTED_TAB_ORDER.length)).toEqual(EXPECTED_TAB_ORDER);
  });

  it('keeps the same base field order on an assignment posting', () => {
    const { container } = renderAssignmentPosting();
    const order = focusableLabels(container);
    expect(order.slice(0, EXPECTED_TAB_ORDER.length)).toEqual(EXPECTED_TAB_ORDER);
  });
});
