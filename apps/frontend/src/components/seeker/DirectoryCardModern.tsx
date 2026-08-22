'use client';
// FILE: src/components/seeker/DirectoryCardModern.tsx
import { useState } from 'react';
import { MapPin, ArrowUpRight } from 'lucide-react';
import type { ICompany } from '../../types';
import CompanyLogo from './CompanyLogo';

interface Props {
  company: ICompany;
  adminActions?: React.ReactNode;
}

export default function DirectoryCardModern({ company, adminActions }: Props) {
  const [hovered, setHovered] = useState(false);

  const careerHref = company.careersUrl || (company.domain ? `https://${company.domain}/careers` : '#');
  const cityList = (company.cities || []).slice(0, 3);
  const extraCities = (company.cities?.length || 0) - cityList.length;

  return (
    <a
      href={careerHref}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={company.companyName}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        padding: 16,
        textDecoration: 'none',
        background: 'var(--surface)',
        border: '1px solid',
        borderColor: hovered ? 'var(--border-strong)' : 'var(--border)',
        borderRadius: 12,
        transition: 'all 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered ? 'var(--shadow-sm)' : 'none',
        position: 'relative',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <CompanyLogo
          name={company.companyName}
          domain={company.domain}
          size={42}
          borderRadius={11}
          style={{ flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
            <h3 style={{
              fontSize: '0.97rem',
              fontWeight: 600,
              color: 'var(--ink)',
              letterSpacing: '-0.012em',
              lineHeight: 1.3,
              /* Reserve 2 line-heights so short and long names occupy the same
                 vertical space — keeps cards in a row aligned and stops a wrapped
                 title from overlapping the rows below it. */
              minHeight: '2.6em',
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              wordBreak: 'break-word',
            }}>
              {company.companyName}
            </h3>
            <ArrowUpRight size={14} style={{
              color: hovered ? 'var(--accent)' : 'var(--ink-faint)',
              flexShrink: 0,
              marginTop: 2,
              transition: 'color 160ms ease',
            }} />
          </div>
          <p style={{
            fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: 3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {company.industry || (company.domain && company.domain.replace(/^https?:\/\//, ''))}
          </p>
        </div>
      </div>

      {/* Open roles count */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        background: 'var(--paper-2)',
        borderRadius: 9,
        fontSize: '0.82rem',
      }}>
        <span style={{ color: 'var(--ink-muted)' }}>Open roles</span>
        <span style={{
          fontWeight: 600,
          color: company.openRoles > 0 ? 'var(--accent)' : 'var(--ink-faint)',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {company.openRoles}
        </span>
      </div>

      {/* Locations */}
      {cityList.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          fontSize: '0.78rem',
          color: 'var(--ink-muted)',
          flexWrap: 'wrap',
        }}>
          <MapPin size={12} style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: '1 1 auto' }}>
            {cityList.join(' · ')}
            {extraCities > 0 ? ` +${extraCities}` : ''}
          </span>
        </div>
      )}

      {adminActions && (
        <div style={{ display: 'flex', gap: 6, paddingTop: 6, borderTop: '1px solid var(--border)' }}>
          {adminActions}
        </div>
      )}
    </a>
  );
}
