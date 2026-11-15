'use client';
// FILE: src/components/seeker/DashboardFilterSheet.tsx
// Mobile filter bottom sheet, portaled to document.body to escape the
// .page-enter containing block (same as DashboardJobSheet).

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '../ui';
import DashboardFilterSheetFields from './DashboardFilterSheetFields';
import type { JobFacets } from './dashboard/useJobFacets';
import type { FilterState, Option } from './dashboard/filter-schema';
import { Z } from '@/theme/tokens';
import { useFocusTrap } from '../ui/useFocusTrap';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeFilterCount: number;
  visibleJobsCount: number;
  clearAllFilters: () => void;
  filters: FilterState;
  setFilters: (patch: Partial<FilterState>) => void;
  roleOptions: Option[];
  experienceOptions: Option[];
  facets: JobFacets;
}

export default function DashboardFilterSheet({
  isOpen, onClose, activeFilterCount, visibleJobsCount, clearAllFilters,
  filters, setFilters, roleOptions, experienceOptions, facets,
}: Props) {
  const [mounted, setMounted] = useState(isOpen);
  const [closing, setClosing] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

  // Salary committed on a short debounce to avoid a refetch per keystroke.
  const [salMin, setSalMin] = useState(filters.salaryMin);
  const [salMax, setSalMax] = useState(filters.salaryMax);
  useEffect(() => { setSalMin(filters.salaryMin); setSalMax(filters.salaryMax); }, [filters.salaryMin, filters.salaryMax]);
  useEffect(() => {
    if (salMin === filters.salaryMin && salMax === filters.salaryMax) return;
    const t = setTimeout(() => setFilters({ salaryMin: salMin, salaryMax: salMax }), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salMin, salMax]);

  const stableClose = useCallback(() => { onClose(); }, [onClose]);
  const panelRef = useFocusTrap<HTMLDivElement>(isOpen && mounted, stableClose);

  useEffect(() => {
    if (isOpen) { setMounted(true); setClosing(false); }
    else if (mounted) {
      setClosing(true);
      const t = setTimeout(() => setMounted(false), 220);
      return () => clearTimeout(t);
    }
  }, [isOpen, mounted]);

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    const { body } = document;
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';

    return () => {
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  if (!hydrated || !mounted) return null;

  return createPortal(
    <div
      onClick={stableClose}
      style={{
        position: 'fixed', inset: 0, zIndex: Z.sheet,
        background: 'rgba(15,15,14,0.45)',
        animation: `${closing ? 'sheetFadeIn' : 'sheetFadeIn'} 0.22s ease ${closing ? 'reverse' : 'normal'}`,
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Job filters"
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'var(--surface)',
          borderTopLeftRadius: 18, borderTopRightRadius: 18,
          maxHeight: '85vh',
          display: 'flex', flexDirection: 'column',
          animation: `${closing ? 'sheetSlideDown' : 'sheetSlideUp'} 0.28s cubic-bezier(0.16, 1, 0.3, 1)`,
          paddingBottom: 'env(safe-area-inset-bottom)',
          overscrollBehavior: 'contain',
        }}
      >
        {/* Drag handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 999,
          background: 'var(--border-strong)',
          margin: '8px auto 0',
        }} />

        <div style={{
          padding: '14px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid var(--border)',
        }}>
          <h2 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 600 }}>
            Filters {activeFilterCount > 0 && <span style={{ color: 'var(--ink-muted)', fontWeight: 500, fontSize: '0.85rem' }}>· {activeFilterCount}</span>}
          </h2>
          <button onClick={stableClose} aria-label="Close" style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'var(--paper-2)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--ink-muted)', cursor: 'pointer',
          }}>
            <X size={14} />
          </button>
        </div>

        <DashboardFilterSheetFields
          filters={filters}
          setFilters={setFilters}
          roleOptions={roleOptions}
          experienceOptions={experienceOptions}
          facets={facets}
          salMin={salMin} salMax={salMax}
          setSalMin={setSalMin} setSalMax={setSalMax}
        />

        <div style={{
          padding: '12px 20px',
          borderTop: '1px solid var(--border)',
          background: 'var(--paper-2)',
          display: 'flex', gap: 8,
        }}>
          <Button variant="ghost" size="md" onClick={clearAllFilters} style={{ flex: 1 }}>Clear all</Button>
          <Button variant="primary" size="md" onClick={stableClose} style={{ flex: 2 }}>
            Show {visibleJobsCount} results
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
