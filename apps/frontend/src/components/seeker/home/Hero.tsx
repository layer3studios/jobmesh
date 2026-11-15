// FILE: src/components/seeker/home/Hero.tsx
// The first impression: the ink photograph, the Three.js mesh scene over it,
// and one Instrument Serif italic statement with two doors. Server component
// — the statement is in the HTML for crawlers; only the scene is client.
//
// The statement is split into words, each in a clipped line, so ScrollMotion
// can raise them one by one. With scripting off they simply sit at rest.
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { COPY } from '../../../theme/brand';
import type { HomeCounts } from './shared';

/** "Where talent finds" / "its next chapter" — one clipped line per word. */
function StatementWords({ text }: { text: string }) {
  return (
    <>
      {text.split(' ').map((word, index) => (
        <span key={`${word}-${index}`}>
          <span className="hm-line"><span className="hm-word">{word}</span></span>{' '}
        </span>
      ))}
    </>
  );
}

export default function Hero({ counts, employerSideEnabled }: { counts: HomeCounts; employerSideEnabled: boolean }) {
  const badgeText = counts.jobCount > 0
    ? `${counts.jobCount.toLocaleString('en-IN')}+ ${COPY.home.metricRolesLabel}`
    : COPY.home.rolesAddedDaily;

  return (
    <section className="hm-section hm-hero" aria-labelledby="hero-heading">

      <div className="hm-hero__content">
        <div className="hm-hero__badge hm-mono">
          <span className="hm-hero__dot" aria-hidden="true" />
          {badgeText}
        </div>

        <h1 id="hero-heading" className="hm-serif hm-hero__title">
          <StatementWords text={COPY.home.heroStatement} />
        </h1>

        <p className="hm-hero__lede">
          {employerSideEnabled ? COPY.home.heroLede : COPY.home.heroLedeSeekerOnly}
        </p>

        {/* Two doors when both halves are open. With the hire half off the
            second door would be the only way out of a one-sided page, so it
            becomes the companies directory rather than disappearing and
            leaving a lone button adrift in the middle of the hero. */}
        <div className="hm-hero__doors">
          <Link href="/jobs" className="hm-pill hm-pill--solid hm-pill--lg">
            {COPY.home.heroPrimaryCTA}
            <ArrowRight size={17} className="hm-pill__arrow" aria-hidden="true" />
          </Link>
          {employerSideEnabled ? (
            <Link href="/hire" className="hm-pill hm-pill--ghost hm-pill--lg">
              {COPY.home.heroSecondaryCTA2}
            </Link>
          ) : (
            <Link href="/directory" className="hm-pill hm-pill--ghost hm-pill--lg">
              {COPY.home.heroSecondaryCTA}
            </Link>
          )}
        </div>
      </div>

      <div className="hm-hero__cue hm-mono" aria-hidden="true">
        <span className="hm-hero__cue-line" />
        {COPY.home.scrollCue}
      </div>
    </section>
  );
}
