// FILE: src/components/seeker/home/HomeClient.tsx
// Composition shell for the guest landing page. The server page fetches the
// company directory and the aggregate counters and passes them in (SSR/SEO).
//
// `.hm-root` scopes the ink tokens (styles/home.css) to this page — always
// ink-on-#09090B whatever the theme toggle says — and owns its own nav and
// footer; SeekerAppShell steps aside on "/".
//
// Structure follows the reference design: the product is SHOWN, section by
// section, for each audience in turn — never a job list (that answers the
// question the page exists to raise) and never a paragraph where a panel
// would do. Ink photographs under the hero, the companies section, the spine
// and the close; flat canvas between, so colour reads as punctuation.
import type { ICompany } from '../../../types';
import type { HomeCounts } from './shared';
import LandingNav from './LandingNav';
import Ticker from './Ticker';
import Hero from './Hero';
import SeekerShowcase from './SeekerShowcase';
import CompanyShowcase from './CompanyShowcase';
import TrustStrip from './TrustStrip';
import LogoStrip from './LogoStrip';
import MeshSpine from './MeshSpine';
import HowItWorks from './HowItWorks';
import CompaniesGrid from './CompaniesGrid';
import FinalCTA from './FinalCTA';
import LandingFooter from './LandingFooter';
import InkImage from './InkImage';
import ScrollMotion from './ScrollMotion';

interface Props extends HomeCounts {
  companies: ICompany[];
}

export default function HomeClient({
  companies, jobCount, companyCount, todayCount, topHiringNames,
}: Props) {
  const counts: HomeCounts = { jobCount, companyCount, todayCount, topHiringNames };

  return (
    <div className="hm-root">
      <ScrollMotion scope=".hm-root" />
      <LandingNav />
      <Ticker counts={counts} />
      <Hero counts={counts} />
      <SeekerShowcase />
      <CompanyShowcase />
      <TrustStrip counts={counts} />
      <LogoStrip companies={companies} />
      <MeshSpine />
      <HowItWorks />
      <CompaniesGrid companies={companies} />
      {/* The close and the footer share the last photograph, as in the reference. */}
      <div className="hm-final-wrap">
        <InkImage name="ink-hero" treatment="final" />
        <FinalCTA />
        <LandingFooter />
      </div>
    </div>
  );
}
