import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useState } from 'react';

vi.mock('@/lib/posthog', () => ({ getPostHogClient: () => ({ capture: vi.fn() }) }));

import AssignmentSection from '@/components/apply/AssignmentSection';
import { useAssignmentFiles } from '@/components/apply/useAssignmentFiles';

// The section is driven entirely by props + the uploads hook, so the harness is the
// smallest possible parent that owns the same state ApplyFormClient owns.
function Harness({ allowedFileTypes = ['pdf', 'md'] }: { allowedFileTypes?: string[] }) {
  const [links, setLinks] = useState<string[]>(['']);
  const [linkErrors, setLinkErrors] = useState<Array<string | null>>([null]);
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [notes, setNotes] = useState('');
  const uploads = useAssignmentFiles({ postingId: 'job-1', allowedFileTypes, enabled: true });
  return (
    <AssignmentSection
      allowedFileTypes={allowedFileTypes}
      links={links}
      linkErrors={linkErrors}
      github={github}
      linkedin={linkedin}
      notes={notes}
      uploads={uploads}
      disabled={false}
      onLinkChange={(i, v) => setLinks((rows) => rows.map((row, idx) => (idx === i ? v : row)))}
      onLinkBlur={() => setLinkErrors((rows) => rows)}
      onAddLink={() => {
        setLinks((rows) => (rows.length >= 5 ? rows : [...rows, '']));
        setLinkErrors((rows) => (rows.length >= 5 ? rows : [...rows, null]));
      }}
      onRemoveLink={(i) => setLinks((rows) => rows.filter((_, idx) => idx !== i))}
      onGithubChange={setGithub}
      onLinkedinChange={setLinkedin}
      onNotesChange={setNotes}
      onFieldBlur={() => {}}
    />
  );
}

function makeFile(name: string, sizeBytes = 1024, type = 'application/pdf'): File {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: sizeBytes });
  return file;
}

function pick(files: File[]) {
  const input = document.querySelector('input[type="file"]') as HTMLInputElement;
  fireEvent.change(input, { target: { files } });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async () => ({
    ok: true,
    status: 201,
    json: async () => ({ fileId: `tok-${Math.random()}`, originalName: 'file.pdf', sizeBytes: 1024, mimeType: 'application/pdf', expiresAt: 'x' }),
  }));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe('AssignmentSection — files', () => {
  it('hides the dropzone entirely when the employer accepts no file types', () => {
    render(<Harness allowedFileTypes={[]} />);
    expect(document.querySelector('input[type="file"]')).toBeNull();
    expect(screen.queryByLabelText('Add submission files')).toBeNull();
  });

  it('shows the dropzone with a real <input type="file"> when file types are allowed', () => {
    render(<Harness />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.multiple).toBe(true);
    expect(input.getAttribute('accept')).toBe('.pdf,.md');
  });

  it('rejects a .exe client-side and NEVER uploads it', async () => {
    render(<Harness />);
    pick([makeFile('payload.exe', 1024, 'application/octet-stream')]);
    await screen.findByText(/Only PDF, MD files are accepted/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects an 11MB file client-side and never uploads it', async () => {
    render(<Harness />);
    pick([makeFile('huge.pdf', 11 * 1024 * 1024)]);
    await screen.findByText(/must be 10MB or smaller/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('blocks the 6th file', async () => {
    render(<Harness />);
    pick([1, 2, 3, 4, 5].map((n) => makeFile(`f${n}.pdf`)));
    await waitFor(() => expect(screen.getAllByText('Uploaded')).toHaveLength(5));
    pick([makeFile('sixth.pdf')]);
    await screen.findByText(/at most 5 files/i);
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it('one failed upload leaves the others done, and offers retry for that row only', async () => {
    let call = 0;
    fetchMock.mockImplementation(async () => {
      call += 1;
      if (call === 2) return { ok: false, status: 500, json: async () => ({ error: 'Upload failed.', code: 'UPLOAD_FAILED' }) };
      return { ok: true, status: 201, json: async () => ({ fileId: `tok-${call}`, originalName: `f${call}.pdf`, sizeBytes: 10, mimeType: 'application/pdf', expiresAt: 'x' }) };
    });
    render(<Harness />);
    pick([makeFile('a.pdf'), makeFile('b.pdf'), makeFile('c.pdf')]);

    await waitFor(() => expect(screen.getByText('Failed')).toBeTruthy());
    expect(screen.getAllByText('Uploaded')).toHaveLength(2);
    // Exactly one retry button — the failure is isolated to its own row.
    expect(screen.getAllByRole('button', { name: /^Retry upload of/ })).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: /^Retry upload of/ }));
    await waitFor(() => expect(screen.getAllByText('Uploaded')).toHaveLength(3));
    expect(screen.queryByText('Failed')).toBeNull();
  });

  it('removing a row drops it from the list', async () => {
    render(<Harness />);
    pick([makeFile('a.pdf')]);
    // The row is renamed to the server's sanitized originalName once staged.
    await screen.findByText('Uploaded');
    fireEvent.click(screen.getByRole('button', { name: /^Remove / }));
    expect(screen.queryByText('Uploaded')).toBeNull();
  });
});

describe('AssignmentSection — links', () => {
  it('blocks a 6th link row', () => {
    render(<Harness />);
    for (let i = 0; i < 6; i += 1) {
      const add = screen.queryByRole('button', { name: '+ Add another link' });
      if (add) fireEvent.click(add);
    }
    expect(screen.getAllByLabelText(/^Submission link/)).toHaveLength(5);
    // The affordance disappears at the cap rather than silently doing nothing.
    expect(screen.queryByRole('button', { name: '+ Add another link' })).toBeNull();
  });

  it('shows the private-link warning for a github URL', () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText('Submission link 1'), {
      target: { value: 'https://github.com/asha/take-home' },
    });
    expect(screen.getByText(/private browser window/i)).toBeTruthy();
  });

  it('does not show the private-link warning for an ordinary site', () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText('Submission link 1'), {
      target: { value: 'https://asha.dev/work' },
    });
    expect(screen.queryByText(/private browser window/i)).toBeNull();
  });

  it('shows the helper copy under the first row only', () => {
    render(<Harness />);
    expect(screen.getAllByText(/wherever your work lives/i)).toHaveLength(1);
  });
});

describe('AssignmentSection — profile + notes', () => {
  it('a github repo URL produces a hint, never a field error', () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText(/GitHub profile/i), {
      target: { value: 'https://github.com/asha/take-home' },
    });
    expect(screen.getByText(/looks like a repository/i)).toBeTruthy();
    expect(screen.queryByText(/Enter a valid GitHub URL/i)).toBeNull();
  });

  it('updates the notes counter and enforces the 5000 cap', () => {
    render(<Harness />);
    const notes = screen.getByLabelText(/Notes on your approach/i) as HTMLTextAreaElement;
    fireEvent.change(notes, { target: { value: 'abc' } });
    expect(screen.getByText('3 / 5000')).toBeTruthy();

    fireEvent.change(notes, { target: { value: 'x'.repeat(6000) } });
    expect(screen.getByText('5000 / 5000')).toBeTruthy();
    expect((screen.getByLabelText(/Notes on your approach/i) as HTMLTextAreaElement).value).toHaveLength(5000);
  });
});
