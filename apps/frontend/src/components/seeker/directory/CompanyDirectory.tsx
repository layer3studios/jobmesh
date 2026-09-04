'use client';
// FILE: src/components/seeker/directory/CompanyDirectory.tsx
// Ported verbatim from the Vite pages/seeker/CompanyDirectory.tsx. The only change
// is the URL-state layer: the Vite router's writable useSearchParams([sp, setSp]) →
// Next's read-only useSearchParams() + router.replace/push (Phase 9a). Behaviour
// (debounced search, sort, pagination, page reset on filter change) is preserved.
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Search, X, Building2 } from 'lucide-react';
import { useCompanies, type SortOption } from '../../../hooks/seeker/useCompanies';
import { Container, PageHeader, EmptyState } from '../../ui';
import DirectoryCard from '../DirectoryCard';
import { FilterDropdown } from '../FilterDropdown';
import { desktopSelectStyle } from '../dashboard/constants';
import SkeletonCompanyCard from '../SkeletonCompanyCard';
import Pagination from '../Pagination';
import { COPY } from '../../../theme/brand';

const PAGE_SIZE = 24;

export default function CompanyDirectory() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const page = Math.max(1, parseInt(sp.get('page') || '1', 10));
  const search = sp.get('q') || '';
  const sort = (sp.get('sort') || 'most-hiring') as SortOption;
  const [searchInput, setSearchInput] = useState(search);

  // Write helper: clone current params, mutate, navigate. router is stable in Next
  // (unlike the Vite router's setSp), so the identity-churn workaround is unnecessary.
  const setParams = useCallback((mutate: (p: URLSearchParams) => void, replace = false) => {
    const n = new URLSearchParams(Array.from(sp.entries()));
    mutate(n);
    const qs = n.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    if (replace) router.replace(url); else router.push(url);
  }, [sp, pathname, router]);

  // Debounce search. Only sync when the typed value actually differs from the URL's
  // current `q`; resets the page param so a new search starts on page 1.
  useEffect(() => {
    if (searchInput === search) return;
    const t = setTimeout(() => {
      setParams(n => {
        if (searchInput) n.set('q', searchInput); else n.delete('q');
        n.delete('page');
      }, true);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput, search, setParams]);

  const { companies, total, totalPages, loading, error } = useCompanies({ page, limit: PAGE_SIZE, search, sort });

  const goToPage = (p: number) => {
    setParams(n => n.set('page', String(p)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setSort = (s: SortOption) => {
    setParams(n => { n.set('sort', s); n.delete('page'); });
  };

  return (
    <Container size="xl" style={{ paddingTop: 'clamp(24px, 5vw, 40px)', paddingBottom: 60 }}>
      <PageHeader
        label={`${COPY.directory.pageLabel} · ${loading ? 'Loading…' : `${total.toLocaleString()} companies actively hiring`}`}
        title={<>{COPY.directory.pageTitle1} <em>{COPY.directory.pageTitle2}</em></>}
      />

      {/* Search + sort */}
      <div style={{ display: 'flex', gap: 'var(--gutter)', flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)', zIndex: 1 }} />
          <input
            className="jb-search glass"
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder={COPY.directory.searchPlaceholder}
            aria-label={COPY.directory.searchAriaLabel}
            style={{
              width: '100%', height: 44, padding: '0 36px 0 40px',
              fontFamily: 'inherit', fontSize: 14, color: 'var(--ink)',
              borderRadius: 12, outline: 'none',
            }}
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              style={{
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                background: 'transparent', border: 'none', padding: 4, cursor: 'pointer',
                color: 'var(--ink-faint)',
              }}
              aria-label="Clear"
            >
              <X size={12} />
            </button>
          )}
        </div>
        <FilterDropdown
          label={COPY.directory.sortAriaLabel}
          options={[
            { value: 'most-hiring', label: COPY.directory.sortMostHiring },
            { value: 'a-z', label: COPY.directory.sortAZ },
            { value: 'z-a', label: COPY.directory.sortZA },
          ]}
          value={sort}
          onChange={v => setSort(v as SortOption)}
          baseStyle={{ ...desktopSelectStyle, height: 44, borderRadius: 12 }}
          minWidth={180}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="companies-grid">
          {Array(8).fill(0).map((_, i) => <SkeletonCompanyCard key={i} />)}
        </div>
      ) : error ? (
        <EmptyState icon={<Building2 size={28} />} title="Couldn't load companies" body={error} />
      ) : companies.length === 0 ? (
        <EmptyState
          icon={<Building2 size={28} />}
          title={COPY.directory.noCompaniesTitle}
          body={COPY.directory.noCompaniesBody}
        />
      ) : (
        <>
          <div className="companies-grid stagger">
            {companies.map(c => (
              <DirectoryCard key={c._id || c.companyName} company={c} />
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ marginTop: 32 }}>
              <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
            </div>
          )}
        </>
      )}
    </Container>
  );
}
