// FILE: src/components/seeker/home/FinalCTA.tsx
// The closing statement. HomeClient wraps this and the footer in one block
// over the last ink photograph (final treatment), exactly as the reference
// does — so the page ends where it began, in the ink.
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { COPY } from '../../../theme/brand';

export default function FinalCTA() {
  return (
    <section className="hm-section hm-final" aria-labelledby="final-heading">
      <h2 id="final-heading" className="hm-serif hm-final__title" data-reveal>{COPY.home.finalTitle}</h2>
      <div className="hm-final__actions" data-reveal>
        <Link href="/jobs" className="hm-pill hm-pill--solid hm-pill--lg">
          {COPY.home.finalButton}
          <ArrowRight size={17} className="hm-pill__arrow" aria-hidden="true" />
        </Link>
        <span className="hm-final__note hm-mono">{COPY.home.finalNote}</span>
      </div>
    </section>
  );
}
