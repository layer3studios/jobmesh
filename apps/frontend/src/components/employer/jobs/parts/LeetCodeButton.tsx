'use client';
// FILE: src/components/employer/jobs/parts/LeetCodeButton.tsx
// The LeetCode entry point in the applicant sidebar: a one-line summary that opens
// the full record.
//
// THE BUTTON CARRIES THE HEADLINE NUMBERS so a recruiter scanning the sidebar can
// often skip the modal entirely — "347 solved · 1848" answers the question for
// most candidates, and only the ones worth a closer look cost a click.
//
// Renders nothing without data, which is the common case: most applicants are not
// JobMesh seekers, and an empty or disabled control would imply otherwise.

import { useState } from 'react';
import { Code2 } from 'lucide-react';
import type { LeetCodeProfile } from '@/types/seeker-profile';
import LeetCodeModal from '../LeetCodeModal';

export default function LeetCodeButton({ data }: { data: LeetCodeProfile | null | undefined }) {
  const [isOpen, setIsOpen] = useState(false);
  if (!data) return null;

  const summary = [
    `${data.totalSolved.toLocaleString()} solved`,
    data.contestRating != null ? String(data.contestRating) : null,
  ].filter(Boolean).join(' · ');

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 7, width: '100%',
          padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
          // Outlined in the accent rather than filled: it is a way in, not the
          // action this page is for.
          border: '1px solid var(--accent)', background: 'transparent',
          color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 500,
          textAlign: 'left',
        }}
      >
        <Code2 size={14} aria-hidden="true" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          LeetCode · {summary}
        </span>
        {data.isStale && (
          <span title="Last successful read — LeetCode was unreachable" style={{ color: 'var(--warning)' }}>
            ·
          </span>
        )}
      </button>
      <LeetCodeModal data={data} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
