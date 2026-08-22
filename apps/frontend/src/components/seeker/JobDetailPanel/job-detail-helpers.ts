// FILE: src/components/seeker/JobDetailPanel/job-detail-helpers.ts
// Pure helpers + shared CSS. Re-exported via the shim at ../JobDetailPanel.tsx
// so existing import sites keep working.

import type { CSSProperties } from 'react';
import type { IJob, IJobAutoTags } from '../../../types';

export function stripHtmlText(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

export function buildSkillsRegex(skills: string[]): RegExp | null {
  if (!skills || skills.length === 0) return null;
  const escaped = skills
    .filter(s => s && s.trim().length >= 1)
    .map(s => s.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (escaped.length === 0) return null;
  return new RegExp(`\\b(${escaped.join('|')})\\b`, 'gi');
}

export function relTime(d: string | null): string | null {
  if (!d) return null;
  const t = new Date(d);
  if (isNaN(t.getTime())) return null;
  const diff = Math.floor((Date.now() - t.getTime()) / 86400000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return '1d ago';
  if (diff < 7) return `${diff}d ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  return `${Math.floor(diff / 30)}mo ago`;
}

export const DEFAULT_AUTO_TAGS: IJobAutoTags = {
  techStack: [], roleCategory: null, experienceBand: null, isEntryLevel: null,
  domain: [], urgency: null, education: null,
};

export function getAutoTags(job: IJob): IJobAutoTags {
  return job.autoTags ?? DEFAULT_AUTO_TAGS;
}

export function roleBadgeStyle(role: string | null): { bg: string; color: string } {
  if (!role) return { bg: 'var(--paper-2)', color: 'var(--ink-muted)' };
  const r = role.toLowerCase();
  if (r.includes('engineer') || r.includes('developer') || r.includes('dev')) return { bg: 'var(--info-soft)', color: 'var(--info)' };
  if (r.includes('design')) return { bg: 'var(--accent-soft)', color: 'var(--accent)' };
  if (r.includes('product')) return { bg: 'var(--warning-soft)', color: 'var(--warning)' };
  if (r.includes('data') || r.includes('analyst')) return { bg: 'var(--status-purple-bg)', color: 'var(--cat-indigo)' };
  if (r.includes('manag')) return { bg: 'var(--success-soft)', color: 'var(--success)' };
  if (r.includes('sales') || r.includes('account')) return { bg: 'var(--danger-soft)', color: 'var(--danger)' };
  return { bg: 'var(--paper-2)', color: 'var(--ink-muted)' };
}

export function inferWorkplace(job: IJob): string | null {
  const wt = (job.WorkplaceType || '').toLowerCase();
  if (wt === 'remote' || job.IsRemote) return 'Remote';
  if (wt === 'hybrid') return 'Hybrid';
  if (wt === 'on-site' || wt === 'onsite') return 'On-site';
  const loc = (job.Location || '').toLowerCase();
  if (loc.includes('remote')) return 'Remote';
  if (loc.includes('hybrid')) return 'Hybrid';
  return null;
}

// Boilerplate detection — chunks that talk about company benefits / EEO
export const BOILERPLATE_REGEX = /\b(equal\s+opportunity|EEO|diversity|inclusion|benefits|perks|why\s+work|about\s+(us|the\s+company)|our\s+mission|our\s+values)/i;

export const metaPill: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 4,
  padding: '3px 9px', borderRadius: 6,
  background: 'var(--paper-2)', color: 'var(--ink-muted)',
  fontSize: '0.72rem', fontWeight: 500,
};

export const sectionLabel: CSSProperties = {
  fontSize: '0.7rem', fontWeight: 600,
  color: 'var(--ink-faint)',
  letterSpacing: '0.05em', textTransform: 'uppercase',
  marginBottom: 8,
};
