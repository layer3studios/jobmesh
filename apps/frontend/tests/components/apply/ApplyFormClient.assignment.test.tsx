import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

// vi.mock is hoisted above every import, so the spies it closes over have to be
// created by vi.hoisted rather than as ordinary module-level consts.
const { capture, submitApplication, uploadAssignmentFile, copyToClipboard } = vi.hoisted(() => ({
  capture: vi.fn(),
  submitApplication: vi.fn(),
  uploadAssignmentFile: vi.fn(),
  copyToClipboard: vi.fn(),
}));

vi.mock('@/lib/posthog', () => ({ getPostHogClient: () => ({ capture }) }));
vi.mock('@/hooks/shared/useViewport', () => ({ useViewport: () => ({ w: 1200 }) }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  // ApplyFormClient reads ?source= to pre-answer the "how did you hear about us" field.
  useSearchParams: () => new URLSearchParams(),
}));
// Only submitApplication is replaced — PublicApiError and expiredFilesFrom stay real
// so the error-handling tests exercise the actual body-parsing path.
vi.mock('@/api/public-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/public-api')>()),
  submitApplication,
}));
vi.mock('@/api/assignment-files-api', () => ({ uploadAssignmentFile }));
vi.mock('@/lib/clipboard', () => ({ copyToClipboard }));

import ApplyFormClient from '@/components/apply/ApplyFormClient';
import { PublicApiError } from '@/api/public-api';
import { draftKey, readDraft, writeDraft } from '@/components/apply/assignment-draft';
import type { PublicAssignment, PublicCompany, PublicJob } from '@/types/public-apply';

const company = { name: 'Acme', slug: 'acme' } as unknown as PublicCompany;
const job = { id: 'job-1', slug: 'dev', title: 'Developer' } as unknown as PublicJob;
const assignment: PublicAssignment = {
  id: 'asg-1',
  title: 'Build a small dashboard',
  publicSummary: 'A short take-home.',
  descriptionMarkdown: '# Task',
  submissionInstructionsMarkdown: 'Send a link.',
  estimatedHours: 2,
  allowedFileTypes: ['pdf', 'md'],
};

function renderForm(props: Partial<React.ComponentProps<typeof ApplyFormClient>> = {}) {
  return render(
    <ApplyFormClient company={company} job={job} companySlug="acme" jobSlug="dev" {...props} />,
  );
}

function makePdf(name = 'resume.pdf'): File {
  return new File(['x'], name, { type: 'application/pdf' });
}

/** Fill everything the BASE apply form requires (name, email, resume, consent). */
function fillBaseFields() {
  fireEvent.change(screen.getByLabelText(/First name/i), { target: { value: 'Asha' } });
  fireEvent.change(screen.getByLabelText(/Last name/i), { target: { value: 'Rao' } });
  fireEvent.change(screen.getByLabelText(/^Email/i), { target: { value: 'asha@example.com' } });
  const resumeInput = document.querySelector('input[accept="application/pdf,.pdf"]') as HTMLInputElement;
  fireEvent.change(resumeInput, { target: { files: [makePdf()] } });
  const consent = document.querySelectorAll('input[type="checkbox"]')[0] as HTMLInputElement;
  fireEvent.click(consent);
}

function setLink(value: string, index = 1) {
  fireEvent.change(screen.getByLabelText(`Submission link ${index}`), { target: { value } });
  fireEvent.blur(screen.getByLabelText(`Submission link ${index}`));
}

function submitButton() {
  return screen.getByRole('button', { name: /Submit application/i });
}

function lastFormData(): FormData {
  return submitApplication.mock.calls[submitApplication.mock.calls.length - 1][2] as unknown as FormData;
}

function keysOf(form: FormData): string[] {
  return Array.from(new Set(Array.from(form.keys())));
}

/** Seed a stored draft. `assignmentId` defaults to the assignment being rendered. */
function storeDraft(overrides: {
  assignmentId?: string;
  fields?: Partial<Parameters<typeof writeDraft>[1]['fields']>;
  files?: Array<{ fileId: string; originalName: string }>;
} = {}) {
  writeDraft(job.id, {
    assignmentId: overrides.assignmentId ?? assignment.id,
    fields: {
      firstName: 'Asha', lastName: 'Rao', email: 'asha@example.com', phone: '9876543210',
      coverNote: '', links: ['https://asha.dev/demo'], github: 'https://github.com/asha',
      linkedin: '', notes: 'my approach',
      ...overrides.fields,
    },
    files: overrides.files ?? [],
  });
}

function pickAssignmentFile(name = 'design.pdf') {
  const inputs = Array.from(document.querySelectorAll('input[type="file"]')) as HTMLInputElement[];
  const dropzoneInput = inputs.find((input) => input.multiple) as HTMLInputElement;
  fireEvent.change(dropzoneInput, { target: { files: [new File(['x'], name, { type: 'application/pdf' })] } });
}

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  copyToClipboard.mockImplementation(async () => true);
  submitApplication.mockImplementation(async () => ({ applicationId: 'a1' }));
  uploadAssignmentFile.mockImplementation(async (file: File) => ({
    fileId: `tok-${file.name}`, originalName: file.name, sizeBytes: 10, mimeType: 'application/pdf', expiresAt: 'x',
  }));
});
afterEach(() => { vi.restoreAllMocks(); });

// ── Rule 1: zero regression on plain postings ────────────────────────────────
describe('plain posting (assignment === null)', () => {
  it('renders no assignment inputs at all', () => {
    renderForm();
    expect(screen.queryByLabelText('Submission link 1')).toBeNull();
    expect(screen.queryByLabelText(/Notes on your approach/i)).toBeNull();
    expect(screen.queryByLabelText('Add submission files')).toBeNull();
  });

  it('submits a FormData with NO assignment* keys and writes no draft', async () => {
    renderForm();
    fillBaseFields();
    fireEvent.click(submitButton());
    await waitFor(() => expect(submitApplication).toHaveBeenCalledTimes(1));

    const keys = keysOf(lastFormData());
    expect(keys).toEqual([
      'firstName', 'lastName', 'email', 'phone', 'coverNote',
      'consent_dpdp', 'consent_futureOpportunities', 'website_url', 'resume',
    ]);
    expect(keys.some((key) => key.startsWith('assignment'))).toBe(false);
    expect(keys).not.toContain('githubUrl');
    expect(keys).not.toContain('linkedinUrl');
    expect(localStorage.getItem(draftKey(job.id))).toBeNull();
  });

  it('the submit gate is unchanged — no assignment reason is ever shown', () => {
    renderForm();
    expect(screen.queryByText(/Add at least one submission link or file/i)).toBeNull();
    fillBaseFields();
    expect((submitButton() as HTMLButtonElement).disabled).toBe(false);
  });
});

// ── The submit gate on an assignment posting ─────────────────────────────────
describe('submit gate', () => {
  it('blocks with 0 links and 0 files, and says why in visible text', () => {
    renderForm({ assignment });
    fillBaseFields();
    expect((submitButton() as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('Add at least one submission link or file.')).toBeTruthy();
  });

  it('one valid link unblocks it', () => {
    renderForm({ assignment });
    fillBaseFields();
    setLink('https://github.com/asha/take-home');
    expect((submitButton() as HTMLButtonElement).disabled).toBe(false);
    expect(screen.queryByText('Add at least one submission link or file.')).toBeNull();
  });

  it('an invalid link does not unblock it', () => {
    renderForm({ assignment });
    fillBaseFields();
    setLink('http://insecure.example.com');
    expect((submitButton() as HTMLButtonElement).disabled).toBe(true);
  });

  it('zero links plus one finished upload unblocks it', async () => {
    renderForm({ assignment });
    fillBaseFields();
    pickAssignmentFile();
    await waitFor(() => expect((submitButton() as HTMLButtonElement).disabled).toBe(false));
  });

  it('a file still uploading does NOT unblock it', async () => {
    let resolveUpload: (value: unknown) => void = () => {};
    uploadAssignmentFile.mockImplementation(() => new Promise((resolve) => { resolveUpload = resolve; }));
    renderForm({ assignment });
    fillBaseFields();
    pickAssignmentFile();
    await screen.findByText('Uploading…');
    expect((submitButton() as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText('Waiting for your upload to finish.')).toBeTruthy();

    await act(async () => {
      resolveUpload({ fileId: 'tok-1', originalName: 'design.pdf', sizeBytes: 10, mimeType: 'application/pdf', expiresAt: 'x' });
    });
    await waitFor(() => expect((submitButton() as HTMLButtonElement).disabled).toBe(false));
  });
});

// ── The submitted payload ────────────────────────────────────────────────────
describe('assignment submit payload', () => {
  it('sends assignmentId, the links and the fileIds', async () => {
    renderForm({ assignment });
    fillBaseFields();
    setLink('https://github.com/asha/take-home');
    fireEvent.click(screen.getByRole('button', { name: '+ Add another link' }));
    setLink('https://asha.dev/demo', 2);
    pickAssignmentFile('design.pdf');
    await waitFor(() => expect(screen.getByText('Uploaded')).toBeTruthy());
    fireEvent.change(screen.getByLabelText(/Notes on your approach/i), { target: { value: 'my approach' } });
    fireEvent.change(screen.getByLabelText(/GitHub profile/i), { target: { value: 'https://github.com/asha' } });
    fireEvent.change(screen.getByLabelText(/LinkedIn profile/i), { target: { value: 'https://in.linkedin.com/in/asha' } });

    fireEvent.click(submitButton());
    await waitFor(() => expect(submitApplication).toHaveBeenCalledTimes(1));

    const form = lastFormData();
    expect(keysOf(form)).toEqual([
      'firstName', 'lastName', 'email', 'phone', 'coverNote',
      'consent_dpdp', 'consent_futureOpportunities', 'website_url', 'resume',
      'assignmentId', 'assignmentLinks[]', 'assignmentFileIds[]',
      'assignmentNotesMarkdown', 'githubUrl', 'linkedinUrl',
    ]);
    expect(form.get('assignmentId')).toBe('asg-1');
    expect(form.getAll('assignmentLinks[]')).toEqual([
      'https://github.com/asha/take-home', 'https://asha.dev/demo',
    ]);
    expect(form.getAll('assignmentFileIds[]')).toEqual(['tok-design.pdf']);
    expect(form.get('assignmentNotesMarkdown')).toBe('my approach');
    expect(form.get('githubUrl')).toBe('https://github.com/asha');
    expect(form.get('linkedinUrl')).toBe('https://in.linkedin.com/in/asha');
  });

  it('extends the existing apply_submitted event rather than adding a new one', async () => {
    renderForm({ assignment });
    fillBaseFields();
    setLink('https://asha.dev/demo');
    fireEvent.click(submitButton());
    await waitFor(() => expect(submitApplication).toHaveBeenCalled());
    const call = capture.mock.calls.find(([name]) => name === 'apply_submitted');
    expect(call?.[1]).toMatchObject({ linkCount: 1, fileCount: 0, hasGithubProfile: false, hasLinkedinProfile: false });
  });

  // Rule 10 — the disabled attribute alone loses this race.
  it('DOUBLE SUBMIT: two rapid clicks produce exactly ONE request', async () => {
    submitApplication.mockImplementation(() => new Promise((resolve) => {
      setTimeout(() => resolve({ applicationId: 'a1' }), 20);
    }));
    renderForm({ assignment });
    fillBaseFields();
    setLink('https://asha.dev/demo');
    const button = submitButton();
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(submitApplication).toHaveBeenCalledTimes(1));
  });
});

// ── Drafts ───────────────────────────────────────────────────────────────────
describe('draft', () => {
  it('writes a draft on blur (debounced) and offers to restore it on remount', async () => {
    const view = renderForm({ assignment });
    fillBaseFields();
    setLink('https://asha.dev/demo');
    fireEvent.change(screen.getByLabelText(/Notes on your approach/i), { target: { value: 'draft notes' } });
    fireEvent.blur(screen.getByLabelText(/Notes on your approach/i));

    // Real timers on purpose: the debounce is a ~2s wall-clock delay and faking it
    // here made the test sensitive to suite load rather than to the behaviour.
    const stored = await waitFor(() => {
      const draft = readDraft(job.id);
      expect(draft).not.toBeNull();
      return draft;
    }, { timeout: 4000, interval: 50 });
    expect(stored?.fields.notes).toBe('draft notes');
    expect(stored?.fields.links).toEqual(['https://asha.dev/demo']);

    view.unmount();
    renderForm({ assignment });
    expect(screen.getByText(/You have unfinished work on this application/i)).toBeTruthy();
  });

  it('the restore prompt tells the candidate to re-attach their resume', () => {
    storeDraft();
    renderForm({ assignment });
    expect(screen.getByText(/You'll need to attach your resume again/i)).toBeTruthy();
  });

  it('never auto-fills — the fields stay empty until Resume is pressed', () => {
    storeDraft({ files: [{ fileId: 'tok-1', originalName: 'design.pdf' }] });
    renderForm({ assignment });
    expect((screen.getByLabelText(/First name/i) as HTMLInputElement).value).toBe('');

    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    expect((screen.getByLabelText(/First name/i) as HTMLInputElement).value).toBe('Asha');
    expect((screen.getByLabelText('Submission link 1') as HTMLInputElement).value).toBe('https://asha.dev/demo');
    expect(screen.getByText('design.pdf')).toBeTruthy();
    const restored = capture.mock.calls.find(([name]) => name === 'assignment_draft_restored');
    expect(restored?.[1]).toEqual({ postingId: 'job-1', fileCount: 1, expiredFileCount: 0 });
  });

  // The employer swapped the task while the draft sat on disk. Restoring the old
  // submission would hand the reviewer answers to a question that no longer exists.
  it('drops links, files and notes when the stored assignmentId no longer matches', () => {
    storeDraft({
      assignmentId: 'asg-OLD',
      files: [{ fileId: 'tok-1', originalName: 'design.pdf' }],
    });
    renderForm({ assignment });
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));

    // Contact details are about the PERSON — they survive.
    expect((screen.getByLabelText(/First name/i) as HTMLInputElement).value).toBe('Asha');
    expect((screen.getByLabelText(/^Email/i) as HTMLInputElement).value).toBe('asha@example.com');
    expect((screen.getByLabelText(/GitHub profile/i) as HTMLInputElement).value).toBe('https://github.com/asha');

    // The submission does not.
    expect((screen.getByLabelText('Submission link 1') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText(/Notes on your approach/i) as HTMLTextAreaElement).value).toBe('');
    expect(screen.queryByText('design.pdf')).toBeNull();

    // And they are told, rather than left to notice an emptied form.
    expect(screen.getByText(
      "The task for this role changed. Your details were restored, but you'll need to redo the submission.",
    )).toBeTruthy();

    // The submit gate is back to blocking, since there is no submission any more.
    expect(screen.getByText('Add at least one submission link or file.')).toBeTruthy();

    const restored = capture.mock.calls.find(([name]) => name === 'assignment_draft_restored');
    expect(restored?.[1]).toEqual({ postingId: 'job-1', fileCount: 0, expiredFileCount: 1 });
  });

  it('keeps the submission when the stored assignmentId still matches', () => {
    storeDraft({ files: [{ fileId: 'tok-1', originalName: 'design.pdf' }] });
    renderForm({ assignment });
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    expect((screen.getByLabelText('Submission link 1') as HTMLInputElement).value).toBe('https://asha.dev/demo');
    expect((screen.getByLabelText(/Notes on your approach/i) as HTMLTextAreaElement).value).toBe('my approach');
    expect(screen.getByText('design.pdf')).toBeTruthy();
    expect(screen.queryByText(/The task for this role changed/i)).toBeNull();
  });

  it('Start over clears the stored draft (it holds PII)', () => {
    storeDraft();
    renderForm({ assignment });
    fireEvent.click(screen.getByRole('button', { name: 'Start over' }));
    expect(localStorage.getItem(draftKey(job.id))).toBeNull();
    expect(screen.queryByText(/You have unfinished work/i)).toBeNull();
  });

  it('clears the draft after a successful submit', async () => {
    storeDraft();
    renderForm({ assignment });
    fillBaseFields();
    setLink('https://asha.dev/demo');
    fireEvent.click(submitButton());
    await waitFor(() => expect(submitApplication).toHaveBeenCalled());
    expect(localStorage.getItem(draftKey(job.id))).toBeNull();
  });

  // Rule 8 — private browsing / quota. The form must be indistinguishable.
  it('STORAGE FAILURE: renders, submits and shows no storage error', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('SecurityError'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('SecurityError'); });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('SecurityError'); });

    renderForm({ assignment });
    fillBaseFields();
    setLink('https://asha.dev/demo');
    fireEvent.blur(screen.getByLabelText('Submission link 1'));
    fireEvent.click(submitButton());
    await waitFor(() => expect(submitApplication).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/storage/i)).toBeNull();
    expect(screen.queryByText(/unfinished work/i)).toBeNull();
  });
});

// ── Server error handling ────────────────────────────────────────────────────
describe('server errors', () => {
  async function submitWith(error: PublicApiError) {
    submitApplication.mockImplementation(async () => { throw error; });
    renderForm({ assignment });
    fillBaseFields();
    setLink('https://asha.dev/demo');
    fireEvent.blur(screen.getByLabelText('Submission link 1'));
    fireEvent.click(submitButton());
    await waitFor(() => expect(submitApplication).toHaveBeenCalled());
  }

  it('STAGED_FILES_EXPIRED flips those rows to error and names the files', async () => {
    submitApplication.mockImplementation(async () => {
      throw new PublicApiError(400, 'STAGED_FILES_EXPIRED', 'Some of your uploaded files have expired.', {
        expiredFiles: [
          { fileId: 'tok-design.pdf', originalName: 'design.pdf' },
          { fileId: 'tok-notes.md', originalName: 'notes.md' },
        ],
      });
    });
    renderForm({ assignment });
    fillBaseFields();
    pickAssignmentFile('design.pdf');
    pickAssignmentFile('notes.md');
    await waitFor(() => expect(screen.getAllByText('Uploaded')).toHaveLength(2));

    fireEvent.click(submitButton());
    await screen.findByText(/2 files expired and need re-uploading: design\.pdf, notes\.md/i);
    await waitFor(() => expect(screen.getAllByText('Failed')).toHaveLength(2));
    expect(screen.queryByText('Uploaded')).toBeNull();
  });

  it('ASSIGNMENT_CHANGED shows a persistent alert with a Refresh button and keeps the draft', async () => {
    storeDraft();
    await submitWith(new PublicApiError(409, 'ASSIGNMENT_CHANGED', 'This assignment was updated while you were working. Refresh to see the latest version.'));
    expect(screen.getByText(/This assignment was updated while you were working/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeTruthy();
    expect(localStorage.getItem(draftKey(job.id))).not.toBeNull();
  });

  it('POSTING_CLOSED_DURING_APPLY keeps the draft and copies the work to the clipboard', async () => {
    storeDraft();
    submitApplication.mockImplementation(async () => {
      throw new PublicApiError(409, 'POSTING_CLOSED_DURING_APPLY', 'This role closed while you were working on the assignment.');
    });
    renderForm({ assignment });
    fillBaseFields();
    setLink('https://asha.dev/demo');
    pickAssignmentFile('design.pdf');
    await waitFor(() => expect(screen.getByText('Uploaded')).toBeTruthy());
    fireEvent.change(screen.getByLabelText(/Notes on your approach/i), { target: { value: 'my approach' } });
    fireEvent.click(submitButton());

    await screen.findByText(/This role closed while you were working/i);
    expect(localStorage.getItem(draftKey(job.id))).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Copy my work' }));
    await waitFor(() => expect(copyToClipboard).toHaveBeenCalled());
    const text = copyToClipboard.mock.calls[0][0] as unknown as string;
    expect(text).toContain('https://asha.dev/demo');
    expect(text).toContain('design.pdf');
    expect(text).toContain('my approach');
  });

  // copyToClipboard returning false must never be swallowed — this is the one
  // action a candidate on a closed posting cannot afford to have fail silently.
  it('a refused clipboard reveals the text for manual copying', async () => {
    copyToClipboard.mockImplementation(async () => false);
    await submitWith(new PublicApiError(409, 'POSTING_CLOSED_DURING_APPLY', 'This role closed.'));
    fireEvent.click(screen.getByRole('button', { name: 'Copy my work' }));

    const fallback = await screen.findByLabelText('Your submission, ready to copy') as HTMLTextAreaElement;
    expect(fallback.value).toContain('https://asha.dev/demo');
    expect(screen.getByText(/browser blocked the clipboard/i)).toBeTruthy();
  });

  it('ASSIGNMENT_SUBMISSION_REQUIRED points at the links block', async () => {
    await submitWith(new PublicApiError(400, 'ASSIGNMENT_SUBMISSION_REQUIRED', 'Add at least one link or file for the assignment.'));
    expect(screen.getByText('Add at least one link or file for the assignment.')).toBeTruthy();
  });

  it('MISSING_ASSIGNMENT_ID is reported as our bug, not the candidate\'s, and logged', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    await submitWith(new PublicApiError(400, 'MISSING_ASSIGNMENT_ID', 'This application is missing its assignment reference.'));
    expect(screen.getByText(/Something went wrong on our side/i)).toBeTruthy();
    expect(error).toHaveBeenCalled();
  });

  it('RATE_LIMITED preserves every field the candidate typed', async () => {
    await submitWith(new PublicApiError(429, 'RATE_LIMITED', 'Too many attempts. Try again later.'));
    expect(screen.getByText('Too many attempts. Try again later.')).toBeTruthy();
    expect((screen.getByLabelText(/First name/i) as HTMLInputElement).value).toBe('Asha');
    expect((screen.getByLabelText('Submission link 1') as HTMLInputElement).value).toBe('https://asha.dev/demo');
  });
});
