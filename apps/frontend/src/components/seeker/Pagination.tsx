'use client';
// FILE: src/components/seeker/Pagination.tsx
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  siblingCount?: number;
}

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export default function Pagination({ page, totalPages, onPageChange, siblingCount = 1 }: Props) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 640 : false);
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  if (totalPages <= 1) return null;

  const sib = isMobile ? 0 : siblingCount;
  const totalNums = 5 + sib * 2;
  const items: (number | 'dots')[] = [];
  if (totalPages <= totalNums) items.push(...range(1, totalPages));
  else {
    const leftBound = Math.max(2, page - sib);
    const rightBound = Math.min(totalPages - 1, page + sib);
    items.push(1);
    if (leftBound > 2) items.push('dots');
    items.push(...range(leftBound, rightBound));
    if (rightBound < totalPages - 1) items.push('dots');
    items.push(totalPages);
  }

  const btn = (active = false, disabled = false): React.CSSProperties => ({
    minWidth: 36, height: 36, padding: '0 10px',
    borderRadius: 9,
    border: '1px solid',
    borderColor: active ? 'var(--accent)' : 'var(--border)',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#fff' : disabled ? 'var(--ink-faint)' : 'var(--ink-2)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    fontSize: '0.85rem',
    fontWeight: active ? 600 : 500,
    display: 'inline-flex',
    alignItems: 'center', justifyContent: 'center',
    transition: 'all 160ms ease',
    opacity: disabled ? 0.5 : 1,
  });

  return (
    <nav aria-label="Pagination" style={{ display: 'flex', gap: 5, justifyContent: 'center', flexWrap: 'wrap' }}>
      {!isMobile && (
        <button onClick={() => onPageChange(1)} disabled={page === 1} style={btn(false, page === 1)} aria-label="First page">
          <ChevronsLeft size={14} />
        </button>
      )}
      <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1} style={btn(false, page === 1)} aria-label="Previous page">
        <ChevronLeft size={14} />
      </button>
      {items.map((it, i) => it === 'dots' ? (
        <span key={`d${i}`} style={{ ...btn(false, true), border: 'none', minWidth: 24 }}>…</span>
      ) : (
        <button key={it} onClick={() => onPageChange(it as number)} style={btn(it === page)}>{it}</button>
      ))}
      <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} style={btn(false, page === totalPages)} aria-label="Next page">
        <ChevronRight size={14} />
      </button>
      {!isMobile && (
        <button onClick={() => onPageChange(totalPages)} disabled={page === totalPages} style={btn(false, page === totalPages)} aria-label="Last page">
          <ChevronsRight size={14} />
        </button>
      )}
    </nav>
  );
}
