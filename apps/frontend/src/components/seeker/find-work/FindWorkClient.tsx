// FILE: src/components/seeker/find-work/FindWorkClient.tsx
// Composition for /find-work — the seeker landing page reached from JOBS in
// the landing nav. Same chrome, tokens and choreography as the landing so the
// pages read as one product. Hero (cubes, search → /jobs) → trust strip →
// the seeker showcase → logo wall → close on the ink.
import type { ICompany } from '../../../types';
import type { HomeCounts } from '../home/shared';
import LandingNav from '../home/LandingNav';
import LandingFooter from '../home/LandingFooter';
import ScrollMotion from '../home/ScrollMotion';
import TrustStrip from '../home/TrustStrip';
import SeekerShowcase from '../home/SeekerShowcase';
import LogoStrip from '../home/LogoStrip';
import InkImage from '../home/InkImage';
import FinalCTA from '../home/FinalCTA';
import FindWorkHero from './FindWorkHero';

interface Props extends HomeCounts { companies: ICompany[] }

export default function FindWorkClient({ companies, jobCount, companyCount, todayCount, topHiringNames }: Props) {
  const counts: HomeCounts = { jobCount, companyCount, todayCount, topHiringNames };
  return (
    <div className="hm-root">
      <ScrollMotion scope=".hm-root" />
      <LandingNav />
      <FindWorkHero todayCount={todayCount} />
      <TrustStrip counts={counts} />
      <SeekerShowcase />
      <LogoStrip companies={companies} />
      <div className="hm-final-wrap">
        <InkImage name="ink-hero" treatment="final" />
        <FinalCTA />
        <LandingFooter />
      </div>
    </div>
  );
}
