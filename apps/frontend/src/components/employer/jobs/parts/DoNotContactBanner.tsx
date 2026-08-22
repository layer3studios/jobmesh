'use client';
// FILE: src/components/employer/jobs/parts/DoNotContactBanner.tsx
// The warning that has to be read BEFORE someone reaches out.
//
// It sits at the TOP of the contact card, above the email address and the mailto
// link, because a warning placed under the thing it is warning about has already
// failed. Danger colouring, but stated in words too — this must survive a greyscale
// screenshot and a screen reader, not rely on being red.
//
// It names who set it and when. "Do not contact" with no attribution invites the
// next recruiter to assume it was a mistake and ignore it.

import { Ban } from 'lucide-react';
import type { DoNotContact } from '@/types/employer-applicants';
import { COPY } from '@/theme/brand';

const C = COPY.employer.applicants;

const BANNER_STYLE = {
  display: 'flex', gap: 8, alignItems: 'flex-start',
  padding: '9px 11px', borderRadius: 8,
  background: 'var(--danger-soft)', borderLeft: '2px solid var(--danger)',
};

function formatSetAt(setAt: string | null): string | null {
  if (!setAt) return null;
  const date = new Date(setAt);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export default function DoNotContactBanner({ doNotContact }: { doNotContact: DoNotContact }) {
  if (!doNotContact.flag) return null;
  const setAt = formatSetAt(doNotContact.setAt);
  const meta = setAt
    ? C.doNotContactMeta
      .replace('{name}', doNotContact.setByName || C.doNotContactUnknownSetter)
      .replace('{date}', setAt)
    : null;

  return (
    <div role="alert" style={BANNER_STYLE}>
      <Ban size={15} aria-hidden="true" style={{ flexShrink: 0, marginTop: 1, color: 'var(--danger)' }} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--danger)' }}>{C.doNotContactBanner}</div>
        {meta && <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 1 }}>{meta}</div>}
        {/* The reason is the operative content — it is what tells the reader
            whether this still applies. Wrapped, never truncated. */}
        {doNotContact.reason && (
          <div style={{ fontSize: 12, color: 'var(--ink-2)', marginTop: 3, wordBreak: 'break-word' }}>
            {doNotContact.reason}
          </div>
        )}
      </div>
    </div>
  );
}
