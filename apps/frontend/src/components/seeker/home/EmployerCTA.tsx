// FILE: src/components/seeker/home/EmployerCTA.tsx
// Section 8 — a quiet cross-sell for the employer ATS, last thing before the
// footer. Deliberately understated: it signals to an employer who lands here
// that there is a real product behind the aggregator, without turning the
// seeker landing page into an employer pitch. Stacks vertically under 640px.
import { ArrowRight } from 'lucide-react';
import { COPY } from '../../../theme/brand';
import { getEmployerUrl } from '../../../lib/subdomain-urls';

export default function EmployerCTA() {
  return (
    <section className="hm-section hm-employer" aria-labelledby="employer-heading">
      <div>
        <h2 id="employer-heading" className="hm-employer__title">{COPY.home.employerCTATitle}</h2>
        <p className="hm-employer__sub">{COPY.home.employerCTASubtitle}</p>
      </div>

      {/* Cross-audience: hire.jobmesh.in in production, /employer in dev. A plain
          next/link would 404 in prod — /employer does not exist on this host. */}
      <a href={getEmployerUrl('/login')} className="hm-ghost">
        {COPY.home.employerCTAButton}
        <ArrowRight size={13} aria-hidden="true" />
      </a>
    </section>
  );
}
