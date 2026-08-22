'use client';
// FILE: src/components/layouts/parts/MobileDropdown.tsx
import { LogOut, BookOpen } from 'lucide-react';
import { mobileMenuButton } from './types';

interface User { name: string; email: string; picture?: string; }

interface Props {
  user: User;
  todayCount: number;
  streak: number;
  onClose: () => void;
  onOpenSkillsEditor: () => void;
  onLogout: () => void;
}

export default function MobileDropdown({ user, todayCount, streak, onClose, onOpenSkillsEditor, onLogout }: Props) {
  return (
    <div
      className="anim-fade"
      style={{
        borderTop: '1px solid var(--border)',
        background: 'var(--surface)',
        padding: '14px 16px',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 12px', borderRadius: 10,
        background: 'var(--paper-2)', border: '1px solid var(--border)',
      }}>
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)' }}>{user.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', marginTop: 2 }}>
            {todayCount} applied today{streak > 0 ? ` · ${streak}d streak` : ''}
          </div>
        </div>
        <img
          src={user.picture}
          alt={user.name}
          style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
      </div>
      <button onClick={() => { onClose(); onOpenSkillsEditor(); }} style={mobileMenuButton}>
        <BookOpen size={15} /> My skills
      </button>
      <button onClick={() => { onClose(); onLogout(); }} style={mobileMenuButton}>
        <LogOut size={15} /> Sign out
      </button>
    </div>
  );
}
