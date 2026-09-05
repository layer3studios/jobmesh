// FILE: src/app/(admin)/admin/(app)/team/loading.tsx
// Route-level skeleton while the roster SSR-fetches: header row + table block.
const shimmer = {
  background: 'var(--paper-2)', border: '1px solid var(--border)', borderRadius: 12,
} as const;

export default function Loading() {
  return (
    <div>
      <div className="anim-pulse" style={{ ...shimmer, height: 34, width: 140, marginBottom: 20 }} />
      <div className="anim-pulse" style={{ ...shimmer, height: 320 }} />
    </div>
  );
}
