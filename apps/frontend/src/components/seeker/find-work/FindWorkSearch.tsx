'use client';
// FILE: src/components/seeker/find-work/FindWorkSearch.tsx
// The search console from the reference's job-board screen: one elevated
// object — text field, hairline divider, location readout, white button —
// with the suggestion row beneath. It lives on the LANDING page and hands the
// query to the real board: submit pushes to /jobs?q=…, which the Dashboard
// reads. Empty or tags-only input never navigates.
import { useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, MapPin, Search } from 'lucide-react';
import { COPY } from '../../../theme/brand';

function sanitizeQuery(raw: string): string | null {
  const cleaned = raw.trim().replace(/<[^>]*>/g, '').trim();
  return cleaned ? encodeURIComponent(cleaned) : null;
}

export default function FindWorkSearch() {
  const router = useRouter();
  const [value, setValue] = useState('');

  const submit = () => {
    const query = sanitizeQuery(value);
    router.push(query ? `/jobs?q=${query}` : '/jobs');
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') { event.preventDefault(); submit(); }
  };

  return (
    <>
      <div className="fw-search" data-reveal>
        <div className="fw-search__field">
          <Search size={18} className="fw-search__icon" aria-hidden="true" />
          <input
            className="fw-search__input"
            type="search"
            value={value}
            onChange={event => setValue(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={COPY.home.searchPlaceholder}
            aria-label={COPY.home.searchAriaLabel}
          />
        </div>
        <span className="fw-search__divider" aria-hidden="true" />
        {/* Single-value affordance — every listing is in India. */}
        <button type="button" className="fw-search__loc" aria-label={COPY.home.locationAriaLabel} onClick={() => router.push('/jobs')}>
          <MapPin size={16} aria-hidden="true" />
          <span>{COPY.home.locationDefault}</span>
          <ChevronDown size={14} aria-hidden="true" />
        </button>
        <button type="button" className="fw-search__btn hm-mono" onClick={submit}>
          {COPY.home.searchButton}
        </button>
      </div>

      <div className="fw-tags" data-reveal>
        <span className="fw-tags__label hm-mono">{COPY.home.quickFiltersLabel}:</span>
        {COPY.home.quickFilters.map(tag => (
          <Link key={tag} href={`/jobs?q=${encodeURIComponent(tag)}`} className="fw-tag hm-mono">{tag}</Link>
        ))}
      </div>
    </>
  );
}
