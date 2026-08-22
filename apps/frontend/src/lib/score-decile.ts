// FILE: src/lib/score-decile.ts
// Buckets a 0-100 applicant score into its decile (0-9) for analytics, so funnels can
// segment by score band without the exact score ever leaving the client. A null score
// (not yet scored) maps to 'unscored'. Out-of-range values are clamped to 0-9 (D4).
export function scoreToDecile(score: number | null | undefined): number | 'unscored' {
  if (score == null) return 'unscored';
  const decile = Math.floor(score / 10);
  if (decile < 0) return 0;
  if (decile > 9) return 9;
  return decile;
}
