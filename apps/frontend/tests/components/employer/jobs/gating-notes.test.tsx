import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ApplicantNotesCard from '@/components/employer/jobs/ApplicantNotesCard';

// Notes are NEVER gated — every role, including an Interviewer with no permission
// flags, can add notes (Chunk 5, item 16 / V13). The component doesn't even import
// the employer context; this test proves the composer renders regardless of role.
vi.mock('@/api/employer-applicants-api', async (importActual) => {
  const actual = await importActual<typeof import('@/api/employer-applicants-api')>();
  return { ...actual, listApplicantNotes: vi.fn(async () => ([])), createApplicantNote: vi.fn() };
});

describe('ApplicantNotesCard is not role-gated', () => {
  it('renders the note composer (no role context consulted)', async () => {
    render(<ApplicantNotesCard applicationId="a1" />);
    await waitFor(() => expect(screen.getByText('No notes yet')).toBeTruthy());
    expect(screen.getByLabelText('Add a note')).toBeTruthy();
    expect(screen.getByText('Save Note')).toBeTruthy();
  });
});
