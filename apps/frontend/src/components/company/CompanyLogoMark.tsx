'use client';
// FILE: src/components/company/CompanyLogoMark.tsx
// A company's uploaded logo with an initials fallback. Lives in its own neutral
// directory because BOTH audiences render it — the employer branding preview and
// the public careers page — and neither may import the other's tree (NAMING §0).
//
// This is NOT src/components/seeker/CompanyLogo.tsx: that one guesses a logo from
// third-party domain lookups for scraped jobs. This one renders exactly the file an
// employer uploaded, or nothing.

import { useEffect, useState } from 'react';
import { getInitials } from '@/components/employer/jobs/score-badge-helpers';

interface Props {
  name: string | null | undefined;
  logoUrl: string | null | undefined;
  size?: number;
  /** Square-ish radius for the image; the initials fallback is always a circle. */
  borderRadius?: number;
  testId?: string;
}

export default function CompanyLogoMark({
  name, logoUrl, size = 48, borderRadius = 12, testId,
}: Props) {
  // A logoUrl can point at a file that was deleted from disk by hand. onError flips
  // this and we fall back to initials rather than rendering a broken image.
  const [failed, setFailed] = useState(false);
  // Reset when the URL changes, otherwise a fresh upload stays hidden behind the
  // previous URL's failure.
  useEffect(() => { setFailed(false); }, [logoUrl]);

  const base = { width: size, height: size, flexShrink: 0 } as const;

  if (logoUrl && !failed) {
    return (
      <img
        src={logoUrl}
        alt={name ?? 'Company logo'}
        data-testid={testId ? `${testId}-image` : undefined}
        onError={() => setFailed(true)}
        style={{
          ...base,
          borderRadius,
          objectFit: 'cover',
          background: 'var(--surface-raised)',
          border: '0.5px solid var(--border)',
          display: 'block',
        }}
      />
    );
  }

  return (
    <span
      aria-hidden
      data-testid={testId}
      style={{
        ...base,
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.round(size * 0.35),
        fontWeight: 600,
        background: 'var(--accent-soft)',
        color: 'var(--accent)',
      }}
    >
      {getInitials(name)}
    </span>
  );
}
