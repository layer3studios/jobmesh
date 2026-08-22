// FILE: src/components/seeker/home/Ticker.tsx
// Section 1 — thin scrolling strip at the very top of the landing page. Server
// component: the string is fully determined by the SSR counts, so there is no
// reason to ship it to the client. Motion, the reduced-motion fallback and the
// accent-soft chrome live in styles/home.css (.hm-ticker).
import { COPY } from '../../../theme/brand';
import type { HomeCounts } from './shared';

export default function Ticker({ counts }: { counts: HomeCounts }) {
  const { todayCount, jobCount, companyCount, topHiringNames } = counts;

  // todayCount === 0 must never render as a literal "0 new roles".
  const lead = todayCount > 0
    ? `${todayCount} ${COPY.home.newRolesToday}`
    : COPY.home.tickerDaily;

  const parts = [
    `✦ ${lead}`,
    topHiringNames.length > 0 ? `${topHiringNames.join(', ')} ${COPY.home.tickerHiring}` : null,
    `${jobCount}+ ${COPY.home.tickerActivePrefix} ${companyCount}+ ${COPY.home.tickerCompaniesSuffix}`,
    COPY.home.tickerSuffix,
  ].filter(Boolean);

  return (
    <div className="hm-ticker hm-mono" role="marquee" aria-live="off">
      <span className="hm-ticker__text">{parts.join(' · ')}</span>
    </div>
  );
}
