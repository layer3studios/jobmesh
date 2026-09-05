// FILE: src/components/seeker/hire/HireClient.tsx
// Composition for /hire. Same chrome, tokens and choreography as the landing
// (`.hm-root`, LandingNav, ScrollMotion, LandingFooter), so moving between the
// two reads as one product. Rhythm: hero (on ink, with the ranked kanban) →
// six proof cards → four steps → logo wall → close on the ink again.
import type { ICompany } from '../../../types';
import LandingNav from '../home/LandingNav';
import LandingFooter from '../home/LandingFooter';
import LogoStrip from '../home/LogoStrip';
import ScrollMotion from '../home/ScrollMotion';
import InkImage from '../home/InkImage';
import HireHero from './HireHero';
import HireFeatures from './HireFeatures';
import HireProcess from './HireProcess';
import HireFinal from './HireFinal';

interface Props {
  companies: ICompany[];
  companyCount: number;
  jobCount: number;
}

export default function HireClient({ companies, companyCount, jobCount }: Props) {
  return (
    <div className="hm-root">
      <ScrollMotion scope=".hm-root" />
      <LandingNav />
      <HireHero companyCount={companyCount} jobCount={jobCount} />
      <HireFeatures />
      <HireProcess />
      <LogoStrip companies={companies} />
      <div className="hm-final-wrap">
        <InkImage name="ink-spine" treatment="final" opacity={0.6} />
        <HireFinal />
        <LandingFooter />
      </div>
    </div>
  );
}
