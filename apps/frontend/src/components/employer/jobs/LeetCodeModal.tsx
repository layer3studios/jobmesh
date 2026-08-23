'use client';
// FILE: src/components/employer/jobs/LeetCodeModal.tsx
// The candidate's LeetCode record, opened from the applicant sidebar.
//
// A modal rather than another sidebar card: this is a detour a recruiter takes
// deliberately when a candidate's problem-solving is the open question, and it
// needs the full width of the heatmap. Inlining it would push the things they
// check on every candidate — contact, resume, notes — below the fold.
//
// Renders the SAME LeetCodeStats the candidate sees on their own profile.

import { ExternalLink } from 'lucide-react';
import { Modal } from '@/components/ui';
import LeetCodeStats from '@/components/seeker/profile/LeetCodeStats';
import type { LeetCodeProfile } from '@/types/seeker-profile';

/** "4 hours ago" — enough to judge whether the numbers are current. */
function relativeTime(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 60) return `${Math.max(minutes, 1)} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default function LeetCodeModal({ data, isOpen, onClose }: {
  data: LeetCodeProfile;
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title={`LeetCode · @${data.username}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <a
            href={`https://leetcode.com/u/${encodeURIComponent(data.username)}/`}
            target="_blank"
            rel="noreferrer noopener"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: '0.8rem', color: 'var(--link)', textDecoration: 'none',
            }}
          >
            Open on LeetCode
            <ExternalLink size={12} aria-hidden="true" />
          </a>
          {data.contestTopPercentage != null && (
            <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
              Top {data.contestTopPercentage}% in contests
            </span>
          )}
        </div>

        {data.isStale && (
          <p style={{
            margin: 0, padding: '7px 10px', borderRadius: 8, fontSize: '0.78rem',
            background: 'var(--warning-soft)', color: 'var(--warning)',
          }}>
            LeetCode could not be reached — these are the last numbers we read.
          </p>
        )}

        <LeetCodeStats data={data} />

        <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--ink-faint)' }}>
          Read {relativeTime(data.fetchedAt)} · refreshes daily. Public LeetCode data,
          connected by the candidate.
        </p>
      </div>
    </Modal>
  );
}
