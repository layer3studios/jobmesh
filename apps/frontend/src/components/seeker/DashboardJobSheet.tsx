'use client';
// FILE: src/components/seeker/DashboardJobSheet.tsx
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { IJob } from '../../types';
import JobDetailPanel from './JobDetailPanel';
import { Z } from '@/theme/tokens';

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

  useEffect(() => {
    if (isOpen) { setMounted(true); setClosing(false); }
    else if (mounted) {
      setClosing(true);
      const t = setTimeout(() => setMounted(false), 240);
      return () => clearTimeout(t);
    }
  }, [isOpen, mounted]);

  if (!mounted || !job) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: Z.sheet,
        background: 'rgba(15,15,14,0.45)',
        animation: `sheetFadeIn 0.22s ease ${closing ? 'reverse' : 'normal'}`,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'var(--surface)',
          borderTopLeftRadius: 18, borderTopRightRadius: 18,
          height: '92vh',
          display: 'flex', flexDirection: 'column',
          animation: `${closing ? 'sheetSlideDown' : 'sheetSlideUp'} 0.3s cubic-bezier(0.16, 1, 0.3, 1)`,
          overflow: 'hidden',
        }}
      >
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
          <button onClick={onClose} aria-label="Close" style={{
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

        <div style={{ flex: 1, overflow: 'hidden' }}>
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
    </div>
  );
}
