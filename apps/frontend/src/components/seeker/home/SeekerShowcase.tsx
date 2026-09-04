// FILE: src/components/seeker/home/SeekerShowcase.tsx
// FOR SEEKERS — the product, shown rather than described. Left: three real
// features, each an icon, a title and one line. Right: the resume-review card
// as it looks in the product — a 79 score with the four dimensions the
// scorer actually reports (parseability, content strength, India market fit,
// skills depth). The card is the argument; the copy only labels it.
import Link from 'next/link';
import { ArrowRight, BarChart3, Code2, ScanSearch } from 'lucide-react';
import { COPY } from '../../../theme/brand';

const ICONS = [ScanSearch, BarChart3, Code2];
const DIMENSIONS = [92, 74, 68, 83]; // illustrative — a picture of the scorer, not live data
const LABELS = ['Parseability', 'Content strength', 'India market fit', 'Skills depth'];

export default function SeekerShowcase() {
  return (
    <section className="hm-section hm-show" aria-labelledby="seekers-heading">
      <div className="hm-wrap hm-show__grid">
        <div className="hm-show__copy" data-reveal>
          <p className="hm-eyebrow hm-mono">{COPY.home.seekerLabel}</p>
          <h2 id="seekers-heading" className="hm-show__title">{COPY.home.seekerTitle}</h2>
          <ul className="hm-show__list">
            {COPY.home.seekerFeatures.map((feature, index) => {
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
          <Link href="/resume" className="hm-more hm-mono">
            {COPY.home.seekerCTA}
            <ArrowRight size={13} className="hm-pill__arrow" aria-hidden="true" />
          </Link>
        </div>

        <div className="hm-card hm-panel hm-panel--score" aria-hidden="true" data-reveal>
          <div className="hm-panel__score">
            <span className="hm-serif hm-serif--roman hm-panel__big">79%</span>
            <span className="hm-panel__score-label hm-mono">{COPY.home.seekerCardScore}</span>
          </div>
          <p className="hm-panel__label hm-mono">{COPY.home.seekerCardLabel}</p>
          <div className="hm-panel__bars">
            {LABELS.map((label, index) => (
              <div key={label} className="hm-bar">
                <span className="hm-bar__label hm-mono">{label}</span>
                <span className="hm-bar__value hm-mono">{DIMENSIONS[index]}%</span>
                <div className="hm-bar__track">
                  <div className="hm-bar__fill" style={{ ['--v' as string]: DIMENSIONS[index] / 100 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
