'use client';
// FILE: src/components/employer/jobs/parts/LeetCodeLookup.tsx
// The LeetCode slot in the applicant sidebar, in whichever of its two states
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
import { Code2, X } from 'lucide-react';
import { Button, Input, Stack } from '@/components/ui';
import {
  lookupApplicantLeetCode, clearApplicantLeetCode, EmployerApplicantsApiError,
} from '@/api/employer-applicants-api';
import type { LeetCodeProfile } from '@/types/seeker-profile';
import LeetCodeButton from './LeetCodeButton';

/** Long enough to read, short enough not to linger over a corrected username. */
const ERROR_CLEAR_MS = 3000;

const HEADING_STYLE = {
  margin: 0, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em',
  textTransform: 'uppercase' as const, color: 'var(--ink-faint)',
};

export default function LeetCodeLookup({ applicationId, initialData, initialUsername }: {
  applicationId: string;
  initialData: LeetCodeProfile | null | undefined;
  initialUsername?: string | null;
}) {
  const [data, setData] = useState<LeetCodeProfile | null>(initialData ?? null);
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
      setData(await lookupApplicantLeetCode(applicationId, trimmed));
    } catch (caught) {
      failWith(
        caught instanceof EmployerApplicantsApiError && caught.code === 'LEETCODE_USER_NOT_FOUND'
          ? 'No LeetCode user with that username.'
          : 'Could not reach LeetCode. Try again.',
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleClear() {
    setIsBusy(true);
    try {
      await clearApplicantLeetCode(applicationId);
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
            <LeetCodeButton data={data} />
          </div>
          <button
            type="button"
            aria-label="Remove LeetCode record from this application"
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
        <Code2 size={13} aria-hidden="true" style={{ color: 'var(--ink-faint)' }} />
        <h4 style={HEADING_STYLE}>LeetCode</h4>
      </Stack>
      <Stack gap={6} dir="row" align="center">
        <div style={{ flex: 1, minWidth: 0 }}>
          <Input
            aria-label="LeetCode username"
            placeholder="Look up a username"
            value={username}
            maxLength={20}
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
