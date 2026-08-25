'use client';
// FILE: src/components/seeker/profile/ProfileSlugField.tsx
// The slug editor inside the public-profile settings card.
//
// AVAILABILITY IS CHECKED, NOT GUESSED. The check is debounced and abortable, so
// typing "ashish-ran" mid-word never fires a request that outlives the next
// keystroke and lands stale — the last response to arrive is always the one for
// the text currently in the box. Committing is separate from checking: the field
// only saves on blur or Enter, so a half-typed address is never persisted.

import { useEffect, useRef, useState } from 'react';
import { Input, Stack } from '../../ui';
import { checkSlugAvailability } from '../../../api/public-profile-api';
import type { SlugAvailability } from '../../../types/public-profile';

const DEBOUNCE_MS = 500;

const MESSAGE_FOR_CODE: Record<string, string> = {
  SLUG_RESERVED: 'That address is reserved.',
  SLUG_INVALID: 'Use 3–30 lowercase letters, numbers and single hyphens.',
};

export default function ProfileSlugField({ slug, onCommit }: {
  slug: string;
  onCommit: (slug: string) => void;
}) {
  const [draft, setDraft] = useState(slug);
  const [status, setStatus] = useState<SlugAvailability | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // A slug changed elsewhere (auto-generated on first publish, or a rejected
  // commit rolled back) must show here.
  useEffect(() => { setDraft(slug); setStatus(null); }, [slug]);

  useEffect(() => {
    const value = draft.trim().toLowerCase();
    if (!value || value === slug) { setStatus(null); return undefined; }

    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      checkSlugAvailability(value, controller.signal)
        .then(setStatus)
        .catch(() => { /* aborted, or offline — the commit will report the truth */ });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [draft, slug]);

  const commit = () => {
    const value = draft.trim().toLowerCase();
    if (!value || value === slug) { setDraft(slug); return; }
    if (status && !status.available) return; // a known-bad address is not committed
    onCommit(value);
  };

  const suggestion = status?.suggestions?.[0] ?? null;
  const error = status && !status.available
    ? (status.code === 'SLUG_TAKEN'
      ? `Taken${suggestion ? ` — try ${suggestion}` : ''}`
      : MESSAGE_FOR_CODE[status.code ?? ''] ?? 'That address cannot be used.')
    : undefined;

  return (
    <Stack gap={6}>
      <Input
        label="Your profile address"
        value={draft}
        error={error}
        hint={!error && status?.available ? 'Available' : 'jobmesh.in/u/…'}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); commit(); } }}
      />
      {suggestion && status?.code === 'SLUG_TAKEN' && (
        <button
          type="button"
          onClick={() => { setDraft(suggestion); onCommit(suggestion); }}
          style={{
            alignSelf: 'flex-start', border: 'none', background: 'none', padding: 0,
            fontSize: '0.8125rem', color: 'var(--link)', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Use {suggestion}
        </button>
      )}
    </Stack>
  );
}
