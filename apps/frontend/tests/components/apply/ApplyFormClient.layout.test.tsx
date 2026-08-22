import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const { viewportWidth } = vi.hoisted(() => ({ viewportWidth: { value: 1200 } }));
vi.mock('@/lib/posthog', () => ({ getPostHogClient: () => null }));
vi.mock('@/hooks/shared/useViewport', () => ({ useViewport: () => ({ w: viewportWidth.value }) }));
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
const job = { id: 'job-1', slug: 'dev', title: 'Developer', description: 'Build things.' } as unknown as PublicJob;
const assignment = { id: 'asg-1', allowedFileTypes: [] } as unknown as PublicAssignment;

// Resolved from the vitest root (the project directory), not from import.meta.url —
// the source assertions below are about files on disk, not about modules.
const PAGE_SOURCE_PATH = resolve(process.cwd(), 'src/app/(apply)/apply/[companySlug]/[jobSlug]/page.tsx');
const PREVIEW_SOURCE_PATH = resolve(process.cwd(), 'src/components/apply/AssignmentPreview.tsx');

function renderWithPreview() {
  return render(
    <ApplyFormClient
      company={company} job={job} companySlug="acme" jobSlug="dev"
      assignment={assignment}
      assignmentPreview={<div data-testid="preview">The task</div>}
    />,
  );
}

describe('assignment preview placement', () => {
  it('renders the preview INSIDE the JD column, before the job description', () => {
    renderWithPreview();
    const heading = screen.getByRole('heading', { name: 'Developer' });
    const jdColumn = heading.parentElement as HTMLElement;
    const preview = screen.getByTestId('preview');

    expect(jdColumn.contains(preview)).toBe(true);
    // …and BEFORE the description, so the reading order is header → task → JD.
    // This assertion used to require the opposite order. It was inverted on
    // purpose: a take-home is the biggest cost in the posting, and disclosing it
    // only after 500 words of job description asks the candidate to invest the
    // reading before they know what they are investing in.
    const description = screen.getByText('Build things.');
    expect(preview.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('does not render the preview when there is no assignment', () => {
    render(<ApplyFormClient company={company} job={job} companySlug="acme" jobSlug="dev" />);
    expect(screen.queryByTestId('preview')).toBeNull();
  });

  it('stacks task-then-form below the two-column breakpoint', () => {
    viewportWidth.value = 700;
    renderWithPreview();
    const preview = screen.getByTestId('preview');
    const submit = screen.getByRole('button', { name: /Submit application/i });
    expect(preview.compareDocumentPosition(submit) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    viewportWidth.value = 1200;
  });

  // Rule: 7a's hand-copied wrapper is DELETED. The layout constants live in exactly
  // one file, so the two can no longer drift apart.
  it('page.tsx carries no duplicated maxWidth/padding wrapper', () => {
    const source = readFileSync(PAGE_SOURCE_PATH, 'utf8');
    expect(source).not.toMatch(/maxWidth:/);
    expect(source).not.toMatch(/paddingLeft:/);
    expect(source).not.toMatch(/APPLY_PAGE_MAX_WIDTH_PIXELS/);
    expect(source).not.toMatch(/APPLY_PAGE_HORIZONTAL_PADDING_PIXELS/);
    // The preview is handed over as an already-rendered element (a Server Component
    // cannot be re-rendered by a client island), not as a component prop.
    expect(source).toMatch(/assignmentPreview=\{assignment \? <AssignmentPreview assignment=\{assignment\} \/> : null\}/);
  });

  it('exactly one element in the rendered tree carries maxWidth 1400', () => {
    const { container } = renderWithPreview();
    const wrappers = Array.from(container.querySelectorAll<HTMLElement>('div'))
      .filter((node) => node.style.maxWidth === '1400px');
    expect(wrappers).toHaveLength(1);
  });

  it('AssignmentPreview is still a Server Component — no use client directive', () => {
    const source = readFileSync(PREVIEW_SOURCE_PATH, 'utf8');
    expect(source).not.toMatch(/['"]use client['"]/);
  });
});
