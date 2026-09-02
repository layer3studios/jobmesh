// FILE: src/types/admin-feature-flags.ts
// Shape contract for /api/admin/feature-flags.

export type FeatureFlagName =
  | 'scraperCronEnabled'
  | 'jdExtractionEnabled'
  | 'aiScoringEnabled'
  | 'publicApplyEnabled';

export type FeatureFlagMap = Record<FeatureFlagName, boolean>;

export interface FeatureFlagsPayload {
  flags: FeatureFlagMap;
  updatedAt: string | null;
  updatedByAdminUserId: string | null;
  names: FeatureFlagName[];
}
