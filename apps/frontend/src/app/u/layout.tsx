// FILE: src/app/u/layout.tsx
// Chrome for the shareable public profile. Deliberately almost nothing — the root
// layout already supplies theme and toasts, and this page needs no more. No nav,
// no brand header, no footer links: the page's own footer carries the single
// "Powered by JobMesh" line, and anything more would compete with the person the
// visitor actually came to read.
//
// A Server Component, so the profile is in the SSR HTML for crawlers and link
// previews.
export default function PublicProfileLayout({ children }: { children: React.ReactNode }) {
  return <div className="pp-page">{children}</div>;
}
