// FILE: src/components/apply/CompanyBrandHeader.tsx
// Masthead for the public careers page: logo, name, tagline, about, socials and
// website. Server-renderable — no state, no handlers — so it costs the candidate
// no JavaScript.
//
// Every field below the name is optional and each is independently conditional. A
// company that has set nothing but a name still gets a correct header rather than a
// column of empty rows.

import CompanyLogoMark from '@/components/company/CompanyLogoMark';
import SocialLinks from './SocialLinks';
import type { PublicCompany } from '@/types/public-apply';

/** "acme.com" — the scheme and any trailing slash are noise in a link label. */
function displayHost(website: string): string {
  try {
    return new URL(website).host.replace(/^www\./, '');
  } catch {
    return website;
  }
}

export default function CompanyBrandHeader({ company }: { company: PublicCompany }) {
  const hasUtilityRow = Boolean(company.socialLinks) || Boolean(company.website);

  return (
    <header className="careers-header">
      <CompanyLogoMark name={company.name} logoUrl={company.logoUrl} size={64} borderRadius={14} />
      <div className="careers-header-text">
        <h1 className="font-display careers-name">{company.name}</h1>
        {company.tagline && <p className="careers-tagline">{company.tagline}</p>}
        {company.about && <p className="careers-about">{company.about}</p>}
        {hasUtilityRow && (
          <div className="careers-utility-row">
            <SocialLinks links={company.socialLinks} companyName={company.name} />
            {company.website && (
              <a
                className="careers-website"
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                {displayHost(company.website)}
              </a>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
