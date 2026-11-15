'use client';
// FILE: src/components/seeker/find-work/FindWorkHero.tsx
// The /find-work hero — the reference's job-board screen: pure ink ground,
// centred badge, "Find your next tech role in India" with the accent in
// italic, the lede, the search console, the suggestion row. Behind it, cubes
// all over the page (CubeField) in real 3D. Search hands off to /jobs.
import { COPY } from '../../../theme/brand';
import FindWorkSearch from './FindWorkSearch';


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

export default function FindWorkHero({ todayCount }: { todayCount: number }) {

  const badgeText = todayCount > 0 ? `${todayCount} ${COPY.home.rolesAddedToday}` : COPY.home.rolesAddedDaily;

  return (
    <section className="hm-section lp-hero" aria-labelledby="find-work-heading">

      <div className="lp-hero__content">
        <div className="hm-hero__badge hm-mono">
          <span className="hm-hero__dot" aria-hidden="true" />
          {badgeText}
        </div>
        <h1 id="find-work-heading" className="hm-serif lp-hero__title">
          <Words text={COPY.findWork.titleLead} />
          <Words text={COPY.findWork.titleAccent} isAccent />
          <Words text={COPY.findWork.titleTail} />
        </h1>
        <p className="hm-hero__lede lp-hero__lede">{COPY.findWork.lede}</p>
        <FindWorkSearch />
      </div>
    </section>
  );
}
