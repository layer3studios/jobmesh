'use client';
// FILE: src/components/ui/Avatar.tsx
// Circular avatar with image + initials fallback.
import { useState } from 'react';
import type { CSSProperties } from 'react';

type AvatarSize = 'sm' | 'md' | 'lg';

const PX: Record<AvatarSize, number> = { sm: 28, md: 36, lg: 48 };

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function Avatar({
  src, name, size = 'md', style,
}: {
  /** Image URL. Falls back to initials when absent or it fails to load. */
  src?: string;
  /** Used for the initials fallback and as the accessible label. */
  name: string;
  /** @default 'md' */
  size?: AvatarSize;
  style?: CSSProperties;
}) {
  const [failed, setFailed] = useState(false);
  const px = PX[size];
  const showImage = src && !failed;

  return (
    <span
      role="img"
      aria-label={name}
      title={name}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: px, height: px, borderRadius: '50%', overflow: 'hidden',
        background: 'var(--accent-soft)', color: 'var(--accent)',
        fontWeight: 600, fontSize: px * 0.4, flexShrink: 0,
        border: '1px solid var(--border)', ...style,
      }}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}
