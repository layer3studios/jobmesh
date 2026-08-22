'use client';
// FILE: src/components/layouts/parts/UserMenu.tsx
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { LogOut, BookOpen, BarChart3 } from 'lucide-react';
import { menuItem } from './types';
import { Z } from '@/theme/tokens';

interface User { name: string; email: string; picture?: string; }

interface Props {
  user: User;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onOpenSkillsEditor: () => void;
  onLogout: () => void;
}

export default function UserMenu({ user, open, onToggle, onClose, onOpenSkillsEditor, onLogout }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={onToggle}
        style={{
          width: 36, height: 36, borderRadius: 10,
          border: '1px solid var(--border)',
          background: 'var(--paper-2)',
          cursor: 'pointer', padding: 0, overflow: 'hidden', flexShrink: 0,
        }}
        title={user.name}
      >
        <img
          src={user.picture}
          alt={user.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      </button>

      {open && (
        <div
          className="anim-scale"
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            minWidth: 220,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12, boxShadow: 'var(--shadow-lg)',
            padding: 6, zIndex: Z.dropdown,
          }}
        >
          <div style={{ padding: '10px 12px 12px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
          </div>
          <button onClick={() => { onClose(); onOpenSkillsEditor(); }} style={menuItem}>
            <BookOpen size={14} /> My skills
          </button>
          <Link href="/progress" onClick={onClose} style={{ ...menuItem, textDecoration: 'none' }}>
            <BarChart3 size={14} /> My progress
          </Link>
          <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
          <button onClick={() => { onClose(); onLogout(); }} style={menuItem}>
            <LogOut size={14} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
