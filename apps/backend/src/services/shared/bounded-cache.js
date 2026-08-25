// FILE: src/services/shared/bounded-cache.js
// The one in-process cache primitive: bounded size, TTL, LRU eviction, injectable
// clock. Generalised out of services/seeker/market-cache.js, which was already the
// only cache in the codebase that could not grow without limit — every other one
// was a bare Map, and a bare Map keyed by anything a caller controls is a memory
// leak with extra steps.
//
// SINGLE INSTANCE ONLY. Nothing here is shared between processes; Redis is the
// multi-instance upgrade. Callers whose keys embed a userId or tenant id must keep
// doing so — this file makes no attempt to isolate one caller's entries from
// another's beyond the key you hand it.

/**
 * Create an isolated cache.
 *
 * ttlMilliseconds — how long an entry counts as fresh.
 * maxEntries      — hard ceiling on retained entries; the least-recently-used one
 *                   is dropped to make room. Map preserves insertion order, and a
 *                   `get` on a live entry re-inserts it, which is what makes the
 *                   first key the LRU key.
 * now             — time source, injectable so tests advance the clock without
 *                   real waits.
 */
export function createBoundedCache({
  ttlMilliseconds, maxEntries, now = Date.now, sweepIntervalMilliseconds = 0,
} = {}) {
  if (!(ttlMilliseconds > 0)) throw new Error('createBoundedCache: ttlMilliseconds must be > 0');
  if (!(maxEntries > 0)) throw new Error('createBoundedCache: maxEntries must be > 0');

  const store = new Map();

  /** The cached value, or null when absent or expired. Expiry deletes on read. */
  function get(key) {
    const entry = store.get(key);
    if (!entry) return null;
    if (now() - entry.storedAt >= ttlMilliseconds) {
      store.delete(key);
      return null;
    }
    store.delete(key);
    store.set(key, entry);
    return entry.value;
  }

  function set(key, value) {
    if (store.has(key)) {
      store.delete(key);
    } else if (store.size >= maxEntries) {
      // Evict the least recently used. A read-time-only TTL would let a key that
      // is never read again sit here forever, so the size ceiling — not the TTL —
      // is what actually bounds this.
      const oldest = store.keys().next().value;
      store.delete(oldest);
    }
    store.set(key, { value, storedAt: now() });
  }

  /** Drop one key, or everything when called with no argument. */
  function invalidate(key) {
    if (key === undefined) store.clear();
    else store.delete(key);
  }

  /**
   * Drop every expired entry. The size ceiling already makes unbounded growth
   * impossible, so this is about not HOLDING what is already dead: entries expire
   * on read, and an entry nobody reads again keeps its value (and whatever that
   * value references) alive until eviction pushes it out.
   *
   * Returns how many it removed, so a test can assert on it.
   */
  function sweep() {
    const cutoff = now();
    let removed = 0;
    for (const [key, entry] of store) {
      if (cutoff - entry.storedAt >= ttlMilliseconds) {
        store.delete(key);
        removed += 1;
      }
    }
    return removed;
  }

  // unref'd on purpose: a housekeeping timer must never be the reason a process
  // (or a test runner) refuses to exit.
  let timer = null;
  if (sweepIntervalMilliseconds > 0) {
    timer = setInterval(sweep, sweepIntervalMilliseconds);
    timer.unref?.();
  }

  /** Stop the sweep timer. Tests only — nothing in app code tears a cache down. */
  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  /** Tests and diagnostics only — never a request path. */
  const size = () => store.size;

  return { get, set, invalidate, clear: () => store.clear(), size, sweep, stop };
}
