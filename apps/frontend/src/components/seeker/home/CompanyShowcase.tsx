// FILE: src/components/seeker/home/CompanyShowcase.tsx
// FOR COMPANIES — the employer product, shown. Sits on the second ink
// photograph (band treatment, 0.7). Left: the pipeline as a glass panel over
// the ink — three stages, candidate chips with their AI score, the offer chip
// inverted to white. Right: three real features. Mirrors the seeker section
// so the two audiences get the same weight in the same shape.
import { ArrowRight, CalendarCheck, ClipboardCheck, Kanban, MoreHorizontal } from 'lucide-react';
import { COPY } from '../../../theme/brand';
import { getEmployerUrl } from '../../../lib/subdomain-urls';
import InkImage from './InkImage';

const ICONS = [ClipboardCheck, Kanban, CalendarCheck];
// Illustrative pipeline — a picture of the kanban, not live data.
const STAGES = [
  { name: 'Screening', count: 8, chips: [{ name: 'Priya S.', score: 87 }, { name: 'Arjun M.', score: 82 }] },
  { name: 'Interview', count: 3, chips: [{ name: 'Neha R.', score: 91 }] },
  { name: 'Offer', count: 1, chips: [{ name: 'Karan T.', score: 94 }] },
];

export default function CompanyShowcase() {
  return (
    <section className="hm-section hm-show hm-show--band" aria-labelledby="companies-heading">
      <InkImage name="ink-companies" treatment="band" />
      <div className="hm-show__veil" aria-hidden="true" />

      <div className="hm-wrap hm-show__grid hm-show__grid--flip">
        <div className="hm-glass hm-panel hm-panel--pipeline" aria-hidden="true" data-reveal>
          <p className="hm-panel__label hm-mono">{COPY.home.companyCardLabel}</p>
          <div className="hm-panel__stages">
            {STAGES.map((stage, stageIndex) => {
              const isLast = stageIndex === STAGES.length - 1;
              return (
                <div key={stage.name} className="hm-stagecard">
                  <div className="hm-stagecard__head hm-mono">
                    <span>{stage.name.toUpperCase()} ({stage.count})</span>
                    <MoreHorizontal size={14} aria-hidden="true" />
                  </div>
                  <div className="hm-stagecard__chips">
                    {stage.chips.map(chip => (
                      <span key={chip.name} className={`hm-chip${isLast ? ' hm-chip--white' : ''}`}>
                        {chip.name} <span className="hm-chip__score hm-mono">{chip.score}%</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="hm-show__copy" data-reveal>
          <p className="hm-eyebrow hm-mono">{COPY.home.companyLabel}</p>
          <h2 id="companies-heading" className="hm-show__title">{COPY.home.companyTitle}</h2>
          <ul className="hm-show__list">
            {COPY.home.companyFeatures.map((feature, index) => {
              const Icon = ICONS[index];
              return (
                <li key={feature.title} className="hm-show__item">
                  <Icon size={22} className="hm-show__icon" aria-hidden="true" />
                  <div>
                    <div className="hm-show__item-title">{feature.title}</div>
                    <div className="hm-show__item-body">{feature.body}</div>
                  </div>
                </li>
              );
            })}
          </ul>
          {/* Cross-audience: hire.jobmesh.in in production, /employer in dev. */}
          <a href={getEmployerUrl('/login')} className="hm-pill hm-pill--solid">
            {COPY.home.companyCTA}
            <ArrowRight size={15} className="hm-pill__arrow" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
