// FILE: src/components/seeker/home/HomeClient.tsx
// Composition shell for the guest landing page. The server page fetches jobs,
// the company directory and the aggregate counters and passes them in (SSR/SEO),
// so nothing here fetches or shows a loading state.
//
// Only <Hero/> is a client component (it owns the search input); every other
// section renders on the server. Signed-in seekers never reach this file —
// page.tsx redirects them to /jobs.
//
// Degradation: LogoStrip/CompaniesGrid hide themselves when the directory is
// empty and JobsFeed hides itself when there are no listings, so a backend
// hiccup still leaves a coherent page (ticker → hero → trust → how → employer).
import type { IJob, ICompany } from '../../../types';
import type { HomeCounts } from './shared';
import Ticker from './Ticker';
import Hero from './Hero';
import TrustStrip from './TrustStrip';
import LogoStrip from './LogoStrip';
import HowItWorks from './HowItWorks';
import CompaniesGrid from './CompaniesGrid';
import JobsFeed from './JobsFeed';
import EmployerCTA from './EmployerCTA';

interface Props extends HomeCounts {
  jobs: IJob[];
  companies: ICompany[];
}

export default function HomeClient({
  jobs, companies, jobCount, companyCount, todayCount, topHiringNames,
}: Props) {
  const counts: HomeCounts = { jobCount, companyCount, todayCount, topHiringNames };

  return (
    <>
      <Ticker counts={counts} />
      <Hero counts={counts} />
      <TrustStrip counts={counts} />
      <LogoStrip companies={companies} />
      <HowItWorks />
      <CompaniesGrid companies={companies} />
      <JobsFeed jobs={jobs} jobCount={jobCount} />
      <EmployerCTA />
    </>
  );
}
