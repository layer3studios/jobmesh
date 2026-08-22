// FILE: admin/ai-usage/parts/ai-usage-format.ts
// Shared formatting + tier colour mapping for the AI usage dashboard.

import type { AiTier } from '@/types/admin-ai-usage';

export const TIER_COLOR: Record<AiTier, string> = {
  employer: 'var(--cat-green)', // green
  seeker: 'var(--cat-blue)',   // blue
  scraper: 'var(--cat-amber)',  // amber
};

export const TIERS: AiTier[] = ['employer', 'seeker', 'scraper'];

/** 1_250_000 → "1.25M". Token counts get long fast. */
export function compactNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

export const percent = (value: number): string => `${value.toFixed(1)}%`;

/**
 * Which tier a model primarily serves, for colour-coding the model table.
 * Gemma models lead the seeker/scraper cascades; Gemini leads employer.
 * Unknown models fall back to employer's colour rather than an odd default.
 */
export function tierForModel(model: string): AiTier {
  if (model.startsWith('gemma')) return 'scraper';
  if (model.includes('lite')) return 'seeker';
  return 'employer';
}

/** "2026-08-02" → "2 Aug" for compact axis labels. */
export function shortDate(dateIso: string): string {
  const parsed = new Date(`${dateIso}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return dateIso;
  return `${parsed.getUTCDate()} ${parsed.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })}`;
}
