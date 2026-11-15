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
import FinalCTA from '../home/FinalCTA';
import FindWorkHero from './FindWorkHero';

interface Props extends HomeCounts {
  companies: ICompany[];
  /** Hire half is live; off hides the employer door in the landing nav. */
  employerSideEnabled: boolean;
}

export default function FindWorkClient({ companies, jobCount, companyCount, todayCount, topHiringNames, employerSideEnabled }: Props) {
  const counts: HomeCounts = { jobCount, companyCount, todayCount, topHiringNames };
  return (
    <div className="hm-root">
      <ScrollMotion scope=".hm-root" />
      <LandingNav employerSideEnabled={employerSideEnabled} />
      <FindWorkHero todayCount={todayCount} />
      <TrustStrip counts={counts} />
      <SeekerShowcase />
      <LogoStrip companies={companies} />
      <div className="hm-final-wrap">
        <FinalCTA />
        <LandingFooter />
      </div>
    </div>
  );
}
