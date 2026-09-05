// FILE: src/components/seeker/hire/HireFeatures.tsx
// Six proof cards — one per feature the employer product actually ships.
// Icon in a hairline square, serif title, one paragraph. The grid reveals
// card by card on scroll (data-reveal → ScrollMotion).
import { CalendarCheck, ClipboardList, Kanban, Link2, ScanSearch, Users } from 'lucide-react';
import { COPY } from '../../../theme/brand';

const ICONS = [ScanSearch, Kanban, ClipboardList, CalendarCheck, Users, Link2];

export default function HireFeatures() {
  return (
    <section className="hm-section hr-proof" aria-labelledby="proof-heading">
      <div className="hm-wrap">
        <header className="hr-proof__head" data-reveal>
          <h2 id="proof-heading" className="hm-serif hm-heading">{COPY.hire.proofHeading}</h2>
          <p className="hm-lede">{COPY.hire.proofLede}</p>
        </header>

        <div className="hr-proof__grid">
          {COPY.hire.features.map((feature, index) => {
            const Icon = ICONS[index];
            return (
              <article key={feature.title} className="hm-card hr-feature" data-reveal>
                <span className="hr-feature__icon" aria-hidden="true"><Icon size={20} /></span>
                <h3 className="hm-serif hr-feature__title">{feature.title}</h3>
                <p className="hr-feature__body">{feature.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
