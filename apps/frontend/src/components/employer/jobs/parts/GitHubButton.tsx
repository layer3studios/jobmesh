'use client';
// FILE: src/components/employer/jobs/parts/GitHubButton.tsx
// The GitHub entry point in the applicant sidebar: a one-line summary that opens
// the full record.
//
// THE BUTTON CARRIES THE HEADLINE NUMBERS so a recruiter scanning the sidebar can
// often skip the modal entirely — "24 repos · ★ 310" answers the question for most
// candidates, and only the ones worth a closer look cost a click.
//
// Renders nothing without data, which is the common case: most applicants are not
// JobMesh seekers, and an empty or disabled control would imply otherwise.

import { useState } from 'react';
import { Github } from 'lucide-react';
import type { GitHubProfile } from '@/types/seeker-profile';
import GitHubModal from '../GitHubModal';

export default function GitHubButton({ data }: { data: GitHubProfile | null | undefined }) {
  const [isOpen, setIsOpen] = useState(false);
  if (!data) return null;

  const repos = `${data.publicRepoCount.toLocaleString()} repo${data.publicRepoCount === 1 ? '' : 's'}`;
  // Stars only when there are any: "★ 0" reads as a judgement, and plenty of
  // strong engineers have none — their work is at their job, not on a profile.
  const summary = data.totalStars > 0 ? `${repos} · ★ ${data.totalStars.toLocaleString()}` : repos;

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
        <Github size={14} aria-hidden="true" style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          GitHub · {summary}
        </span>
        {data.isStale && (
          <span title="Last successful read — GitHub was unreachable" style={{ color: 'var(--warning)' }}>
            ·
          </span>
        )}
      </button>
      <GitHubModal data={data} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
