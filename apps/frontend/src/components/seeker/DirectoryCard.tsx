'use client';
// FILE: src/components/seeker/DirectoryCard.tsx
// One company in the directory grid: logo tile, name, industry, and the
// number that matters — open roles — in the serif, with the cities beside it.
// Hover lifts the pane (board.css .jb-link-card); everything else is in
// workspace.css .dir-card.
import Link from 'next/link';
import { MapPin, ArrowUpRight } from 'lucide-react';
import type { ICompany } from '../../types';
import CompanyLogo from './CompanyLogo';
import { slugifyCompanyName } from '../../utils/slugify-company';

interface Props {
  company: ICompany;
  adminActions?: React.ReactNode;
}

export default function DirectoryCard({ company, adminActions }: Props) {
  const cityList = (company.cities || []).slice(0, 2);
  const extraCities = (company.cities?.length || 0) - cityList.length;
  const href = `/company/${slugifyCompanyName(company.companyName)}`;
  const open = company.openRoles ?? 0;

  return (
    <Link href={href} className="jb-link-card glass dir-card press" title={company.companyName}>
      <div className="dir-card__top">
        <CompanyLogo name={company.companyName} domain={company.domain} size={44} borderRadius={11} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 className="dir-card__name">{company.companyName}</h3>
          <p className="dir-card__sub">{company.industry || (company.domain && company.domain.replace(/^https?:\/\//, '')) || 'Tech'}</p>
        </div>
        <ArrowUpRight size={15} className="dir-card__arrow" aria-hidden />
      </div>

      <div className="dir-card__foot">
        <div>
          <div className="dir-card__num">{open}</div>
          <div className="dir-card__numl">{open > 0 && <span className="dir-card__live" aria-hidden />}{open === 1 ? 'Open role' : 'Open roles'}</div>
        </div>
        {cityList.length > 0 && (
          <div className="dir-card__cities">
            <MapPin size={11} style={{ flexShrink: 0 }} />
            <span>{cityList.join(' · ')}{extraCities > 0 ? ` +${extraCities}` : ''}</span>
          </div>
        )}
      </div>

      {adminActions && <div style={{ position: 'absolute', top: 10, right: 10 }}>{adminActions}</div>}
    </Link>
  );
}
