'use client';
// FILE: src/components/seeker/companies/CompaniesHero.tsx
// The /companies hero — the same centred, pure-ink grammar as /find-work with
// a different signature object: concentric orbits (RingField). A company is
// an orbit; there are many of them round one centre. The console is a
// company search that hands off to the real directory at /directory?q=….
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { COPY } from '../../../theme/brand';
import { trackPointer } from '../home/three/pointer-store';
import { useSceneQuality } from '../home/three/use-scene-quality';

const PageScene = dynamic(() => import('../home/three/PageScene'), { ssr: false });

function Words({ text, isAccent }: { text: string; isAccent?: boolean }) {
  return (
    <>
      {text.split(' ').map((word, index) => (
        <span key={`${word}-${index}`}>
          <span className="hm-line"><span className={`hm-word${isAccent ? ' hm-word--accent' : ''}`}>{word}</span></span>{' '}
        </span>
      ))}
    </>
  );
}

export default function CompaniesHero({ companyCount }: { companyCount: number }) {
  const router = useRouter();
  const hostRef = useRef<HTMLDivElement>(null);
  const { reducedMotion, isLite, isReady } = useSceneQuality();
  const [value, setValue] = useState('');

  useEffect(() => {
    const host = hostRef.current;
    return host ? trackPointer(host) : undefined;
  }, []);

  const submit = () => {
    const query = value.trim().replace(/<[^>]*>/g, '').trim();
    router.push(query ? `/directory?q=${encodeURIComponent(query)}` : '/directory');
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') { event.preventDefault(); submit(); }
  };

  return (
    <section className="hm-section lp-hero" aria-labelledby="companies-heading">
      <div ref={hostRef} className="hm-scene-host">
        {isReady && <PageScene variant="rings" reducedMotion={reducedMotion} isLite={isLite} />}
      </div>
      <div className="lp-hero__veil" aria-hidden="true" />

      <div className="lp-hero__content">
        <div className="hm-hero__badge hm-mono">
          <span className="hm-hero__dot" aria-hidden="true" />
          {companyCount > 0 ? `${companyCount}+ ${COPY.companies.badgeSuffix}` : COPY.companies.badgeFallback}
        </div>
        <h1 id="companies-heading" className="hm-serif lp-hero__title">
          <Words text={COPY.companies.titleLead} />
          <Words text={COPY.companies.titleAccent} isAccent />
        </h1>
        <p className="hm-hero__lede lp-hero__lede">{COPY.companies.lede}</p>

        <div className="fw-search fw-search--single" data-reveal>
          <div className="fw-search__field">
            <Search size={18} className="fw-search__icon" aria-hidden="true" />
            <input
              className="fw-search__input" type="search" value={value}
              onChange={event => setValue(event.target.value)} onKeyDown={onKeyDown}
              placeholder={COPY.directory.searchPlaceholder} aria-label={COPY.directory.searchAriaLabel}
            />
          </div>
          <button type="button" className="fw-search__btn hm-mono" onClick={submit}>{COPY.home.searchButton}</button>
        </div>
      </div>
    </section>
  );
}
