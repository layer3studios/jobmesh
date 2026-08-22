// FILE: src/types/admin-ai-usage.ts
// Shape contract for GET /api/admin/ai-usage. Mirrors the backend's
// buildUsageReport output exactly — no field the backend does not send.

export type AiUsageRange = '7d' | '14d' | '30d' | '90d';

export type AiTier = 'employer' | 'seeker' | 'scraper';

export interface AiUsageSummary {
  totalRequests: number;
  totalTokens: number;
  totalCacheHits: number;
  /** Percentage, already rounded to one decimal by the backend. */
  cacheHitRate: number;
  totalErrors: number;
  errorRate: number;
}

export interface AiTierUsage {
  requests: number;
  tokens: number;
  errors: number;
}

export interface AiModelUsage {
  model: string;
  requests: number;
  tokens: number;
  cacheHits: number;
  errors: number;
  avgTokensPerRequest: number;
}

export interface AiDayUsage {
  date: string;
  requests: number;
  tokens: number;
  cacheHits: number;
  errors: number;
}

/** One budget dimension: how much of the effective ceiling is spent. */
export interface AiLimitBucket {
  used: number;
  limit: number;
}

export interface AiKeyLimits {
  keyIndex: number;
  rpm: AiLimitBucket;
  rpd: AiLimitBucket;
  tpm: AiLimitBucket;
  exhausted?: boolean;
}

export interface AiModelLimits {
  model: string;
  keys: AiKeyLimits[];
}

export interface AiUsageReport {
  summary: AiUsageSummary;
  byTier: Record<AiTier, AiTierUsage>;
  byModel: AiModelUsage[];
  byDay: AiDayUsage[];
  currentLimits: { models: AiModelLimits[] };
  rangeDays?: number;
}
