'use client';
// FILE: src/components/seeker/DashboardJobSheet.tsx
// Full-screen bottom sheet for job detail on non-split viewports.
//
// Portaled to document.body so it escapes the .page-enter ancestor whose
// `animation: pageRise` (with transform) creates a containing block that
// traps position: fixed descendants.
//
// Follows the same portal + focus-trap + scroll-lock pattern as the UI kit
// Drawer (components/ui/Drawer.tsx) and Modal (components/ui/Modal.tsx).

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { IJob } from '../../types';
import JobDetailPanel from './JobDetailPanel';
import { Z } from '@/theme/tokens';
import { useFocusTrap } from '../ui/useFocusTrap';

interface Props {
  job: IJob | null;
  isOpen: boolean;
  onClose: () => void;
  domain?: string;
  appliedJobIds: Set<string>;
  comeBackMap: Record<string, string>;
  onToggleApplied: (jobId: string) => void;
  onToggleComeBack: (jobId: string, note?: string) => void;
  onRemoveComeBack?: (jobId: string) => void;
  onSelectJob?: (job: IJob) => void;
}

export default function DashboardJobSheet({
  job, isOpen, onClose, domain, appliedJobIds, comeBackMap,
  onToggleApplied, onToggleComeBack, onRemoveComeBack, onSelectJob,
}: Props) {
  const [mounted, setMounted] = useState(isOpen);
  const [closing, setClosing] = useState(false);
  /** Guards against rendering portals during SSR. */
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

  // Stable close ref for the focus trap — avoids re-trapping when `onClose`
  // identity changes between renders (the parent passes inline arrow fns).
  const stableClose = useCallback(() => { onClose(); }, [onClose]);
  const panelRef = useFocusTrap<HTMLDivElement>(isOpen && mounted, stableClose);

  // Mount / unmount with a closing-animation delay.
  useEffect(() => {
    if (isOpen) { setMounted(true); setClosing(false); }
    else if (mounted) {
      setClosing(true);
      const t = setTimeout(() => setMounted(false), 240);
      return () => clearTimeout(t);
    }
  }, [isOpen, mounted]);

  // Body scroll lock — saves and restores scroll position to prevent the iOS
  // "jump to top" problem when position: fixed is applied to the body.
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

  if (!hydrated || !mounted || !job) return null;

  return createPortal(
    <div
      onClick={stableClose}
      style={{
        position: 'fixed', inset: 0, zIndex: Z.sheet,
        background: 'rgba(15,15,14,0.45)',
        animation: `sheetFadeIn 0.22s ease ${closing ? 'reverse' : 'normal'}`,
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={job.JobTitle ?? 'Job detail'}
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'var(--surface)',
          borderTopLeftRadius: 18, borderTopRightRadius: 18,
          /* 100dvh accounts for mobile browser chrome (toolbar, address bar).
             Browsers without dvh support use the 92vh fallback. The max()
             wrapper is a no-op (both values are the same intent) but lets us
             express both in one declaration. */
          height: 'max(92vh, calc(100dvh - 36px))',
          display: 'flex', flexDirection: 'column',
          animation: `${closing ? 'sheetSlideDown' : 'sheetSlideUp'} 0.3s cubic-bezier(0.16, 1, 0.3, 1)`,
          overflow: 'hidden',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Drag handle + close button */}
        <div style={{
          padding: '8px 14px 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{
            width: 36, height: 4, borderRadius: 999,
            background: 'var(--border-strong)',
            margin: '0 auto',
            position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 6,
          }} />
          <div style={{ width: 30 }} />
          <button onClick={stableClose} aria-label="Close" style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'var(--paper-2)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--ink-muted)', cursor: 'pointer',
            marginTop: 8,
            position: 'relative', zIndex: 2,
          }}>
            <X size={14} />
          </button>
        </div>

        {/* Scrollable content with overscroll containment */}
        <div style={{
          flex: 1, overflow: 'auto',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
        }}>
          <JobDetailPanel
            job={job}
            domain={domain}
            mobileMode
            appliedJobIds={appliedJobIds}
            comeBackMap={comeBackMap}
            onToggleApplied={onToggleApplied}
            onToggleComeBack={onToggleComeBack}
            onRemoveComeBack={onRemoveComeBack}
            onSelectJob={onSelectJob}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
