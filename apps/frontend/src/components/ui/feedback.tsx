'use client';
// FILE: src/components/ui/feedback.tsx
import type { ReactNode } from 'react';
import { Card } from './Card';
import { Button } from './Button';

interface EmptyStateAction { label: string; onClick: () => void }

export function PageHeader({ label, title, subtitle, actions, compact }: {
  label?: string; title: ReactNode; subtitle?: ReactNode; actions?: ReactNode;
  /** Tighter vertical rhythm for dense pages (e.g. posting detail). */
  compact?: boolean;
}) {
  return (
    <div style={{ marginBottom: compact ? 8 : 20 }}>
      {label && (
        <p style={{
          fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
          fontSize: 11, fontWeight: 500, color: 'var(--ink-muted)',
          marginBottom: compact ? 4 : 10, letterSpacing: '0.08em', textTransform: 'uppercase',
        }}>{label}</p>
      )}
      <div style={{ display: 'flex', justifyContent: actions ? 'space-between' : 'flex-start', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ minWidth: 0, flex: '1 1 280px' }}>
          <h1 className="font-display" style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400,
            color: 'var(--ink)', lineHeight: 1.05, letterSpacing: '-0.04em',
          }}>{title}</h1>
          {subtitle && (
            <div style={{ color: 'var(--ink-muted)', marginTop: 6, fontSize: '0.875rem', lineHeight: 1.55 }}>{subtitle}</div>
          )}
        </div>
        {actions && <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>{actions}</div>}
      </div>
    </div>
  );
}

/**
 * Empty / error placeholder. `heading`+`description` are the documented props;
 * `title`+`body` are accepted as aliases for existing callers. `action` may be
 * a ReactNode or an `{ label, onClick }` object.
 */
export function EmptyState({ icon, title, heading, body, description, action }: {
  icon?: ReactNode;
  title?: string;
  heading?: string;
  body?: string;
  description?: string;
  action?: ReactNode | EmptyStateAction;
}) {
  const head = heading ?? title ?? '';
  const desc = description ?? body;
  const isActionObject = !!action && typeof action === 'object' && 'label' in (action as object);
  return (
    <div className="glass" style={{
      textAlign: 'center', padding: 'clamp(40px, 8vw, 64px) clamp(20px, 4vw, 32px)',
      borderRadius: 14,
    }}>
      {icon && <div style={{ color: 'var(--ink-faint)', marginBottom: 14, display: 'flex', justifyContent: 'center' }}>{icon}</div>}
      <h3 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 400, letterSpacing: '-0.03em', color: 'var(--ink)', marginBottom: 6 }}>{head}</h3>
      {desc && <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem', maxWidth: 380, margin: '0 auto 18px', lineHeight: 1.55 }}>{desc}</p>}
      {isActionObject
        ? <Button onClick={(action as EmptyStateAction).onClick}>{(action as EmptyStateAction).label}</Button>
        : (action as ReactNode)}
    </div>
  );
}

export function Alert({ type = 'info', children }: { type?: 'success' | 'error' | 'warning' | 'info'; children: ReactNode }) {
  const colorMap = {
    success: { bg: 'var(--success-soft)', fg: 'var(--success)' },
    error: { bg: 'var(--danger-soft)', fg: 'var(--danger)' },
    warning: { bg: 'var(--warning-soft)', fg: 'var(--warning)' },
    info: { bg: 'var(--info-soft)', fg: 'var(--info)' },
  }[type];
  return (
    <div style={{
      padding: '11px 14px', borderRadius: 10,
      fontSize: '0.875rem', fontWeight: 500,
      background: colorMap.bg, color: colorMap.fg,
    }}>{children}</div>
  );
}

export function StatCard({ icon, value, label, accent }: { icon: ReactNode; value: ReactNode; label: string; accent?: boolean }) {
  return (
    <Card style={{
      textAlign: 'left',
      borderColor: accent ? 'var(--border-strong)' : 'var(--border)',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: accent ? 'var(--accent-soft)' : 'var(--paper-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: accent ? 'var(--accent)' : 'var(--ink-muted)', marginBottom: 14,
      }}>{icon}</div>
      <div className="font-display" style={{ fontSize: '2rem', fontWeight: 400, color: 'var(--ink)', lineHeight: 1, letterSpacing: '-0.03em' }}>{value}</div>
      <p style={{ fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginTop: 8 }}>{label}</p>
    </Card>
  );
}
