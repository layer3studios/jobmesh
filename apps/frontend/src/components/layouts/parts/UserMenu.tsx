'use client';
// FILE: src/components/layouts/parts/UserMenu.tsx
// The account menu behind the avatar. A glass sheet that scales in from the
// avatar corner and scales back out — one interruptible transition, so a
// quick open/close never snaps. Escape and outside clicks close it; arrow
// keys walk the items. Order: the person, then where they go most.
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { LogOut, BookOpen, BarChart3, UserRound } from 'lucide-react';
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

const CLOSE_MS = 180;

export default function UserMenu({ user, open, onToggle, onClose, onOpenSkillsEditor, onLogout }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  // Mounted a beat longer than `open` so the exit transition can play.
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      // A timer, not requestAnimationFrame: the sheet must still open in a
      // throttled background tab, where rAF is paused.
      const t = setTimeout(() => setShown(true), 16);
      return () => clearTimeout(t);
    }
    setShown(false);
    const t = setTimeout(() => setMounted(false), CLOSE_MS);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      const items = Array.from(sheetRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
      if (!items.length) return;
      e.preventDefault();
      const i = items.indexOf(document.activeElement as HTMLElement);
      items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  const initial = user.name.trim().charAt(0).toUpperCase();

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        className="um-avatar press"
        onClick={onToggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account: ${user.name}`}
        title={user.name}
      >
        {user.picture
          ? <img src={user.picture} alt="" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          : <span>{initial}</span>}
      </button>

      {mounted && (
        <div
          ref={sheetRef}
          role="menu"
          aria-label="Account"
          className="glass glass--strong um-sheet"
          data-open={shown || undefined}
          style={{ zIndex: Z.dropdown }}
        >
          <div className="um-who">
            <div className="um-who__avatar" aria-hidden>
              {user.picture ? <img src={user.picture} alt="" /> : initial}
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="um-who__name">{user.name}</div>
              <div className="um-who__mail">{user.email}</div>
            </div>
          </div>

          <Link href="/profile" role="menuitem" className="um-item" onClick={onClose} style={{ '--i': 0 } as React.CSSProperties}>
            <UserRound size={15} /> My profile
          </Link>
          <Link href="/pipeline" role="menuitem" className="um-item" onClick={onClose} style={{ '--i': 1 } as React.CSSProperties}>
            <BarChart3 size={15} /> My pipeline
          </Link>
          <button type="button" role="menuitem" className="um-item" onClick={() => { onClose(); onOpenSkillsEditor(); }} style={{ '--i': 2 } as React.CSSProperties}>
            <BookOpen size={15} /> My skills
          </button>

          <div className="um-rule" />

          <button type="button" role="menuitem" className="um-item um-item--quiet" onClick={() => { onClose(); onLogout(); }} style={{ '--i': 3 } as React.CSSProperties}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
