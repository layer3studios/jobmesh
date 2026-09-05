// FILE: src/components/seeker/companies/CompaniesShowcase.tsx
// The directory, shown: the twelve companies with the most open roles as
// hairline cards — logo, name, open-role count in mono — each linking into
// the real company page, with one quiet link to the full directory. This is
// the reference's "Company Directory" card grid, on the landing side of the
// door so the visitor sees who is here before they enter.
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { COPY } from '../../../theme/brand';
import type { ICompany } from '../../../types';
import { slugifyCompanyName } from '../../../utils/slugify-company';
import CompanyLogo from '../CompanyLogo';
import { SectionHeader } from '../home/shared';

const MAX_COMPANIES = 12;

export default function CompaniesShowcase({ companies }: { companies: ICompany[] }) {
  const shown = companies.slice(0, MAX_COMPANIES);
  if (shown.length === 0) return null;

  return (
    <section className="hm-section hm-companies" aria-labelledby="companies-grid-heading">
      <div className="hm-wrap">
        <SectionHeader
          eyebrow={COPY.companies.gridEyebrow}
          heading={COPY.companies.gridHeading}
          headingId="companies-grid-heading"
          linkHref="/directory"
          linkLabel={COPY.home.fullDirectory}
        />
        <div className="hm-companies__grid lp-companies__grid">
          {shown.map(company => (
            <Link
              key={company._id || company.companyName}
              href={`/company/${slugifyCompanyName(company.companyName)}`}
              className="hm-card hm-company lp-company"
              data-reveal
            >
              <CompanyLogo name={company.companyName} domain={company.domain} size={40} borderRadius={10} style={{ flexShrink: 0 }} />
              <div className="hm-company__text">
                <div className="hm-company__name">{company.companyName}</div>
                <div className="hm-company__roles hm-mono">
                  {company.openRoles} {company.openRoles === 1 ? COPY.home.openRole : COPY.home.openRoles}
                </div>
              </div>
              <ArrowRight size={14} className="hm-pill__arrow lp-company__arrow" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
