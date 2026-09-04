'use client';
// FILE: src/components/seeker/hire/HireHero.tsx
// The employer hero: statement + lede + two actions on the left, the ranked
// kanban on the right, on the companies ink photograph — and behind the whole
// band, the quietest of the four signature objects: a slow lattice of nodes
// (Lattice), because this hero already carries a product panel and a big
// centred object would fight it.
import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { COPY } from '../../../theme/brand';
import { getEmployerUrl } from '../../../lib/subdomain-urls';
import InkImage from '../home/InkImage';
import { trackPointer } from '../home/three/pointer-store';
import { useSceneQuality } from '../home/three/use-scene-quality';
import HireKanban from './HireKanban';

const PageScene = dynamic(() => import('../home/three/PageScene'), { ssr: false });

interface Props { companyCount: number; jobCount: number }

export default function HireHero({ companyCount, jobCount }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const { reducedMotion, isLite, isReady } = useSceneQuality();

  useEffect(() => {
    const host = hostRef.current;
    return host ? trackPointer(host) : undefined;
  }, []);

  const stats = [
    { value: `${jobCount.toLocaleString('en-IN')}+`, label: COPY.home.metricRolesLabel },
    { value: `${companyCount}+`, label: COPY.home.metricCompaniesLabel },
    { value: COPY.home.metricFreshValue, label: COPY.home.metricFreshLabel },
  ];

  return (
    <section className="hm-section hr-hero" aria-labelledby="hire-heading">
      <InkImage name="ink-companies" treatment="hero" opacity={0.5} />
      <div ref={hostRef} className="hm-scene-host">
        {isReady && <PageScene variant="lattice" reducedMotion={reducedMotion} isLite={isLite} />}
      </div>
      <div className="hm-hero__veil" aria-hidden="true" />

      <div className="hm-wrap hr-hero__grid">
        <div className="hr-hero__copy">
          <div className="hm-hero__badge hm-mono">
            <span className="hm-hero__dot" aria-hidden="true" />
            {COPY.hire.badge}
          </div>
          <h1 id="hire-heading" className="hm-serif hr-hero__title">
            {COPY.hire.title.split(' ').map((word, index) => (
              <span key={`${word}-${index}`}><span className="hm-line"><span className="hm-word">{word}</span></span>{' '}</span>
            ))}
          </h1>
          <p className="hm-hero__lede hr-hero__lede">{COPY.hire.lede}</p>
          <div className="hm-hero__doors hr-hero__doors">
            <a href={getEmployerUrl('/login')} className="hm-pill hm-pill--solid hm-pill--lg">
              {COPY.hire.primaryCTA}
              <ArrowRight size={17} className="hm-pill__arrow" aria-hidden="true" />
            </a>
            <Link href="#how" className="hm-pill hm-pill--ghost hm-pill--lg">{COPY.hire.secondaryCTA}</Link>
          </div>
          <dl className="hr-hero__stats">
            {stats.map(stat => (
              <div key={stat.label} className="hr-hero__stat">
                <dt className="hm-mono hr-hero__stat-label">{stat.label}</dt>
                <dd className="hm-serif hm-serif--roman hr-hero__stat-value">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="hr-hero__panel" data-reveal>
          <HireKanban />
        </div>
      </div>
    </section>
  );
}
