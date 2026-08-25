// FILE: src/services/seeker/market-cache.js
// Bounded, TTL'd in-process LRU for the seeker market services (D5, R4).
// Mirrors the marketPulse in-memory-cache trade-off: fine for a single MVP
// instance; Redis is the multi-instance upgrade (Watch). Time source is
// injectable (now) so tests advance the clock without real waits.
// Cache keys always embed the userId (C8) so a hit for user A can never
// surface for user B.
//
// The mechanism now lives in services/shared/bounded-cache.js — it was the only
// bounded cache in the codebase, so the other callers that needed one were
// copying it or, more often, not. This file keeps its own name, constants and
// API; only the implementation moved.

import { createBoundedCache } from '../shared/bounded-cache.js';

export const TTL_MILLISECONDS = 600_000;
export const MAX_ENTRIES = 500;

/** Create an isolated cache. Prefer the shared `marketCache` in app code. */
export function createMarketCache({
  now = Date.now,
  ttlMilliseconds = TTL_MILLISECONDS,
  maxEntries = MAX_ENTRIES,
} = {}) {
  const cache = createBoundedCache({ ttlMilliseconds, maxEntries, now });
  // The original surface, unchanged: get, set, and a tests-only clear.
  return { get: cache.get, set: cache.set, clear: cache.clear };
}

/** Shared singleton used by the match-count + salary-benchmark services. */
export const marketCache = createMarketCache();
