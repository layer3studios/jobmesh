// FILE: src/app/(admin)/admin/layout.tsx
// Segment layout for /admin. Intentionally UNGUARDED so /admin/login can render
// outside the auth wall. The guard lives in (app)/layout.tsx — same pattern as
// (employer)/employer/(app)/layout.tsx. Route groups in parens do not change URLs,
// so /admin, /admin/employer-access, and /admin/login are all unchanged.
export default function AdminSegmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
