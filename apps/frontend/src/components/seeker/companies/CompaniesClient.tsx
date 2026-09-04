// FILE: src/components/seeker/companies/CompaniesClient.tsx
// Composition for /companies — the companies landing page reached from
// COMPANIES in the landing nav. Hero (orbits, search → /directory) → the
// twelve most-hiring companies as cards → the company-side showcase → close.
import type { ICompany } from '../../../types';
import type { HomeCounts } from '../home/shared';
import LandingNav from '../home/LandingNav';
import LandingFooter from '../home/LandingFooter';
import ScrollMotion from '../home/ScrollMotion';
import TrustStrip from '../home/TrustStrip';
import CompanyShowcase from '../home/CompanyShowcase';
import InkImage from '../home/InkImage';
import FinalCTA from '../home/FinalCTA';
import CompaniesHero from './CompaniesHero';
import CompaniesShowcase from './CompaniesShowcase';

interface Props extends HomeCounts { companies: ICompany[] }

export default function CompaniesClient({ companies, jobCount, companyCount, todayCount, topHiringNames }: Props) {
  const counts: HomeCounts = { jobCount, companyCount, todayCount, topHiringNames };
  return (
    <div className="hm-root">
      <ScrollMotion scope=".hm-root" />
      <LandingNav />
      <CompaniesHero companyCount={companyCount} />
      <TrustStrip counts={counts} />
      <CompaniesShowcase companies={companies} />
      <CompanyShowcase />
      <div className="hm-final-wrap">
        <InkImage name="ink-spine" treatment="final" opacity={0.6} />
        <FinalCTA />
        <LandingFooter />
      </div>
    </div>
  );
}
