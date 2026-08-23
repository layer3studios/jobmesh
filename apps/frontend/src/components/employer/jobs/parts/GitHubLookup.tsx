'use client';
// FILE: src/components/employer/jobs/parts/GitHubLookup.tsx
// The GitHub slot in the applicant sidebar, in whichever of its two states
// applies: a record to open, or a box to find one.
//
// ONE COMPONENT FOR BOTH STATES, holding the record in local state, so looking one
// up swaps the box for the button in place. Re-fetching the whole applicant detail
// to show one number the server just handed back would blank the sidebar the
// recruiter is reading.
//
// The lookup box is offered for candidates who put their handle in the resume
// rather than on the form — the recruiter is already reading the PDF, and this
// saves them a tab.

import { useState } from 'react';
import { Github, X } from 'lucide-react';
import { Button, Input, Stack } from '@/components/ui';
import {
  lookupApplicantGitHub, clearApplicantGitHub, EmployerApplicantsApiError,
} from '@/api/employer-applicants-api';
import type { GitHubProfile } from '@/types/seeker-profile';
import GitHubButton from './GitHubButton';

/** Long enough to read, short enough not to linger over a corrected username. */
const ERROR_CLEAR_MS = 3000;

const HEADING_STYLE = {
  margin: 0, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em',
  textTransform: 'uppercase' as const, color: 'var(--ink-faint)',
};

export default function GitHubLookup({ applicationId, initialData, initialUsername }: {
  applicationId: string;
  initialData: GitHubProfile | null | undefined;
  initialUsername?: string | null;
}) {
  const [data, setData] = useState<GitHubProfile | null>(initialData ?? null);
  const [username, setUsername] = useState(initialUsername ?? '');
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function failWith(message: string) {
    setError(message);
    // Clears itself: the recruiter's next move is to retype, and a message that
    // outlives the mistake makes a corrected username look like it failed too.
    setTimeout(() => setError(null), ERROR_CLEAR_MS);
  }

  async function handleLookup() {
    const trimmed = username.trim();
    if (!trimmed || isBusy) return;
    setIsBusy(true);
    setError(null);
    try {
      setData(await lookupApplicantGitHub(applicationId, trimmed));
    } catch (caught) {
      const code = caught instanceof EmployerApplicantsApiError ? caught.code : null;
      // Three outcomes the recruiter acts on differently: fix the username, wait,
      // or stop trying because the server has no token.
      failWith(
        code === 'GITHUB_USER_NOT_FOUND' ? 'No GitHub user with that username.'
          : code === 'GITHUB_DISABLED' ? 'GitHub lookup is not configured.'
            : 'Could not reach GitHub. Try again.',
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleClear() {
    setIsBusy(true);
    try {
      await clearApplicantGitHub(applicationId);
      setData(null);
      setUsername('');
    } catch {
      failWith('Could not remove it. Try again.');
    } finally {
      setIsBusy(false);
    }
  }

  if (data) {
    return (
      <Stack gap={6}>
        <Stack gap={6} dir="row" align="center">
          <div style={{ flex: 1, minWidth: 0 }}>
            <GitHubButton data={data} />
          </div>
          <button
            type="button"
            aria-label="Remove GitHub record from this application"
            title="Remove from this application"
            disabled={isBusy}
            onClick={() => void handleClear()}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, flexShrink: 0, borderRadius: 8, cursor: 'pointer',
              background: 'transparent', border: '1px solid var(--border)', color: 'var(--ink-faint)',
            }}
          >
            <X size={13} aria-hidden="true" />
          </button>
        </Stack>
        {error && (
          <p role="alert" style={{ margin: 0, fontSize: '0.75rem', color: 'var(--danger)' }}>{error}</p>
        )}
      </Stack>
    );
  }

  return (
    <Stack gap={7}>
      <Stack gap={6} dir="row" align="center">
        <Github size={13} aria-hidden="true" style={{ color: 'var(--ink-faint)' }} />
        <h4 style={HEADING_STYLE}>GitHub</h4>
      </Stack>
      <Stack gap={6} dir="row" align="center">
        <div style={{ flex: 1, minWidth: 0 }}>
          <Input
            aria-label="GitHub username"
            placeholder="Look up a username"
            value={username}
            maxLength={39}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            disabled={isBusy}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void handleLookup(); }}
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={isBusy || !username.trim()}
          onClick={() => void handleLookup()}
        >
          {isBusy ? 'Looking up…' : 'Look up'}
        </Button>
      </Stack>
      {error && (
        <p role="alert" style={{ margin: 0, fontSize: '0.75rem', color: 'var(--danger)' }}>{error}</p>
      )}
    </Stack>
  );
}
