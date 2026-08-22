// FILE: src/components/seeker/home/CompaniesGrid.tsx
// Section 6 — the eight companies with the most open roles (the directory
// arrives sorted by openRoles desc from the backend). Horizontal cards: mark on
// the left, name + count on the right, so the grid scans as a list of logos.
// These are interactive objects, so they earn a border and a hover lift.
import Link from 'next/link';
import { COPY } from '../../../theme/brand';
import type { ICompany } from '../../../types';
import CompanyLogo from '../CompanyLogo';
import { SectionHeader } from './shared';

const MAX_COMPANIES = 8;

export default function CompaniesGrid({ companies }: { companies: ICompany[] }) {
  const shown = companies.slice(0, MAX_COMPANIES);
  if (shown.length === 0) return null; // no directory → hide the whole section

  return (
    <section className="hm-section hm-companies" aria-labelledby="companies-heading">
      <SectionHeader
        eyebrow={COPY.home.companiesSectionLabel}
        heading={COPY.home.companiesHeading}
        headingId="companies-heading"
        linkHref="/directory"
        linkLabel={COPY.home.fullDirectory}
      />

      <div className="hm-companies__grid stagger">
        {shown.map(c => (
          <Link key={c._id || c.companyName} href="/directory" className="hm-company">
            <CompanyLogo
              name={c.companyName}
              domain={c.domain}
              size={34}
              borderRadius={8}
              style={{ flexShrink: 0 }}
            />
            <div className="hm-company__text">
              {/* Long names ellipsis rather than wrap — see .hm-company__name */}
              <div className="hm-company__name">{c.companyName}</div>
              <div className="hm-company__roles hm-mono">
                {c.openRoles} {c.openRoles === 1 ? COPY.home.openRole : COPY.home.openRoles}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
