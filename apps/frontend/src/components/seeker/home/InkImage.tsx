// FILE: src/components/seeker/home/InkImage.tsx
// A full-bleed ink-in-water photograph behind a section — the exact images
// from the reference design, served from /public/landing at 1254px (JPG q82,
// 190–313KB) with a 640px variant for phones.
//
// Three treatments, straight from the reference:
//   hero    — opacity 0.40, fades to the page at the bottom only
//   band    — opacity 0.70, fades in at the top AND out at the bottom
//   final   — opacity 0.80, fades in at the top, holds to the footer
// The image sits at z-index 0, always aria-hidden and never interactive.

type InkImageName = 'ink-hero' | 'ink-companies' | 'ink-spine';
type InkTreatment = 'hero' | 'band' | 'final';

interface InkImageProps {
  name: InkImageName;
  treatment: InkTreatment;
  /** Override the treatment's default opacity. */
  opacity?: number;
}

const OPACITY: Record<InkTreatment, number> = { hero: 0.4, band: 0.7, final: 0.8 };

export default function InkImage({ name, treatment, opacity }: InkImageProps) {
  return (
    <div className={`hm-ink hm-ink--${treatment}`} aria-hidden="true">
      <picture>
        <source media="(max-width: 767px)" srcSet={`/landing/${name}-sm.jpg`} />
        <img
          src={`/landing/${name}.jpg`}
          alt=""
          className="hm-ink__img"
          style={{ opacity: opacity ?? OPACITY[treatment] }}
          loading={treatment === 'hero' ? 'eager' : 'lazy'}
          decoding="async"
          draggable={false}
        />
      </picture>
    </div>
  );
}
