'use client';
// FILE: src/components/employer/jobs/GitHubModal.tsx
// The candidate's GitHub record, opened from the applicant sidebar.
//
// A modal rather than another sidebar card: this is a detour a recruiter takes
// deliberately when a candidate's code is the open question, and it needs the full
// width of the heatmap and the repo grid. Inlining it would push the things they
// check on every candidate — contact, resume, notes — below the fold.
//
// Renders the SAME GitHubStats the candidate sees on their own profile.

import { ExternalLink } from 'lucide-react';
import { Modal } from '@/components/ui';
import GitHubStats from '@/components/seeker/profile/GitHubStats';
import type { GitHubProfile } from '@/types/seeker-profile';

/** "4 hours ago" — enough to judge whether the numbers are current. */
function relativeTime(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default function GitHubModal({ data, isOpen, onClose }: {
  data: GitHubProfile;
  isOpen: boolean;
  onClose: () => void;
}) {
  // Whichever the candidate offered. Both are optional on GitHub, and a bare
  // handle is better than an empty line pretending to be a name.
  const subtitle = [data.name, data.company, data.location].filter(Boolean).join(' · ');

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title={`GitHub · @${data.username}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <a
            href={`https://github.com/${encodeURIComponent(data.username)}`}
            target="_blank"
            rel="noreferrer noopener"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: '0.8rem', color: 'var(--link)', textDecoration: 'none',
            }}
          >
            Open on GitHub
            <ExternalLink size={12} aria-hidden="true" />
          </a>
          {subtitle && (
            <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>{subtitle}</span>
          )}
        </div>

        {data.bio && (
          <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--ink-muted)', maxWidth: '70ch' }}>
            {data.bio}
          </p>
        )}

        {data.isStale && (
          <p style={{
            margin: 0, padding: '7px 10px', borderRadius: 8, fontSize: '0.78rem',
            background: 'var(--warning-soft)', color: 'var(--warning)',
          }}>
            GitHub could not be reached — these are the last numbers we read.
          </p>
        )}

        <GitHubStats data={data} />

        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--ink-faint)' }}>
          Read {relativeTime(data.fetchedAt)} · refreshes daily. Public GitHub data.
        </p>
      </div>
    </Modal>
  );
}
