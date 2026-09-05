// FILE: src/components/BrandMark.tsx
// The JobMesh monogram as an inline SVG: an angular "M" whose left stem drops
// into a J-hook, so the two letters share one stroke. Draws in currentColor, so
// it follows whatever ink it sits on — the JPEG in BrandLogo cannot do that.
// Uniform stroke, chamfered feet, rounded joins to match the source mark.

interface BrandMarkProps {
  size?: number;
  className?: string;
}

export default function BrandMark({ size = 24, className }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={{ display: 'block', flexShrink: 0 }}
    >
      {/* Right leg + both diagonals: a plain M read left to right from the apex. */}
      <path d="M20 14 L32 30 L44 14 V50" />
      {/* Left stem that becomes the J-hook — the shared stroke. */}
      <path d="M20 14 V42 L10 50" />
    </svg>
  );
}
