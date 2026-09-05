// FILE: src/components/seeker/hire/HireFinal.tsx
// The close of the hire page: one statement, one action, one honest note.
// Rendered inside HomeClient-style `.hm-final-wrap` so it shares the ink
// photograph with the footer.
import { ArrowRight } from 'lucide-react';
import { COPY } from '../../../theme/brand';
import { getEmployerUrl } from '../../../lib/subdomain-urls';

export default function HireFinal() {
  return (
    <section className="hm-section hm-final" aria-labelledby="hire-final-heading">
      <h2 id="hire-final-heading" className="hm-serif hm-final__title" data-reveal>{COPY.hire.finalTitle}</h2>
      <div className="hm-final__actions" data-reveal>
        <a href={getEmployerUrl('/login')} className="hm-pill hm-pill--solid hm-pill--lg">
          {COPY.hire.finalCTA}
          <ArrowRight size={17} className="hm-pill__arrow" aria-hidden="true" />
        </a>
        <span className="hm-final__note hm-mono">{COPY.hire.finalNote}</span>
      </div>
    </section>
  );
}
