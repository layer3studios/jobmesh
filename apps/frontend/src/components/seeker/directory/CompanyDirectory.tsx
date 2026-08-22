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
        label={COPY.directory.pageLabel}
        title={<>{COPY.directory.pageTitle1} <span style={{ color: 'var(--accent)' }}>{COPY.directory.pageTitle2}</span></>}
        subtitle={loading ? 'Loading…' : `${total.toLocaleString()} companies actively hiring`}
      />

      {/* Search + sort */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }} />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder={COPY.directory.searchPlaceholder}
            aria-label={COPY.directory.searchAriaLabel}
            style={{
              width: '100%', padding: '10px 12px 10px 34px',
              fontFamily: 'inherit', fontSize: '0.9rem',
              background: 'var(--surface)', color: 'var(--ink)',
              border: '1px solid var(--border-strong)',
              borderRadius: 10, outline: 'none',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'var(--accent)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
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
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortOption)}
          aria-label={COPY.directory.sortAriaLabel}
          style={{
            padding: '10px 32px 10px 12px',
            fontFamily: 'inherit', fontSize: '0.85rem',
            background: 'var(--surface)', color: 'var(--ink)',
            border: '1px solid var(--border-strong)',
            borderRadius: 10, cursor: 'pointer', outline: 'none',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%236F6E69' stroke-width='2'%3E%3Cpath d='M3 5l3 3 3-3'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center',
          }}
        >
          <option value="most-hiring">{COPY.directory.sortMostHiring}</option>
          <option value="a-z">{COPY.directory.sortAZ}</option>
          <option value="z-a">{COPY.directory.sortZA}</option>
        </select>
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
