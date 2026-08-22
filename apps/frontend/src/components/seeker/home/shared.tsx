// FILE: src/components/seeker/home/shared.tsx
// Pieces the landing-page sections share. Presentational only — all visual
// values live in styles/home.css so the sections stay declarative.
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

/** Aggregate counters the page advertises. Computed server-side in page.tsx. */
export interface HomeCounts {
  jobCount: number;
  companyCount: number;
  todayCount: number;
  topHiringNames: string[];
}

interface SectionHeaderProps {
  /** Uppercase, wide-tracked label above the heading. */
  eyebrow: string;
  heading: string;
  /** Must match the parent section's aria-labelledby. */
  headingId: string;
  linkHref: string;
  linkLabel: string;
}

/**
 * Eyebrow + <h2> on the left, a quiet accent link on the right. Used by the
 * companies and jobs sections so their headers stay pixel-identical.
 */
export function SectionHeader({ eyebrow, heading, headingId, linkHref, linkLabel }: SectionHeaderProps) {
  return (
    <div className="hm-section-head">
      <div>
        <p className="hm-eyebrow hm-mono" style={{ marginBottom: 5 }}>{eyebrow}</p>
        <h2 id={headingId} className="hm-heading">{heading}</h2>
      </div>
      <Link href={linkHref} className="hm-more">
        {linkLabel} <ArrowRight size={12} aria-hidden="true" />
      </Link>
    </div>
  );
}
