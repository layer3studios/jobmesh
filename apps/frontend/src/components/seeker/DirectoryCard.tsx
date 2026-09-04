'use client';
// FILE: src/components/seeker/DirectoryCard.tsx
// One company in the directory grid: a glass card with the logo tile, name,
// industry, a mono "OPEN ROLES" figure and the cities. Hover is CSS
// (board.css .jb-link-card) — no hover state in React.
import Link from 'next/link';
import { MapPin, ArrowUpRight } from 'lucide-react';
import type { ICompany } from '../../types';
import CompanyLogo from './CompanyLogo';
import { slugifyCompanyName } from '../../utils/slugify-company';

const MONO = 'var(--font-jetbrains-mono), ui-monospace, monospace';

interface Props {
  company: ICompany;
  adminActions?: React.ReactNode;
}

export default function DirectoryCard({ company, adminActions }: Props) {
  const cityList = (company.cities || []).slice(0, 3);
  const extraCities = (company.cities?.length || 0) - cityList.length;
  const href = `/company/${slugifyCompanyName(company.companyName)}`;

  return (
    <Link
      href={href}
      className="jb-link-card glass"
      title={company.companyName}
      style={{
        display: 'flex', flexDirection: 'column', gap: 14,
        padding: 16, textDecoration: 'none', borderRadius: 12,
        position: 'relative', maxWidth: '100%', boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <CompanyLogo name={company.companyName} domain={company.domain} size={40} borderRadius={10} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <h3 style={{
              fontSize: 15, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.01em', lineHeight: 1.3,
              /* Two line-heights reserved so short and long names align across a row. */
              minHeight: '2.6em', flex: 1, minWidth: 0, overflow: 'hidden',
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', wordBreak: 'break-word',
            }}>
              {company.companyName}
            </h3>
            <ArrowUpRight size={14} style={{ color: 'var(--ink-faint)', flexShrink: 0, marginTop: 2 }} />
          </div>
          <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {company.industry || (company.domain && company.domain.replace(/^https?:\/\//, ''))}
          </p>
        </div>
      </div>

      {/* Open roles: a mono figure on a hairline, not a tinted block. */}
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        paddingTop: 12, borderTop: '1px solid var(--border)',
      }}>
        <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
          Open roles
        </span>
        <span className="font-display" style={{
          fontSize: 24, lineHeight: 1, letterSpacing: '-0.03em',
          color: company.openRoles > 0 ? 'var(--ink)' : 'var(--ink-faint)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {company.openRoles}
        </span>
      </div>

      {cityList.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-muted)' }}>
          <MapPin size={12} style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
            {cityList.join(' · ')}{extraCities > 0 ? ` +${extraCities}` : ''}
          </span>
        </div>
      )}

      {adminActions && (
        <div style={{ display: 'flex', gap: 6, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
          {adminActions}
        </div>
      )}
    </Link>
  );
}
