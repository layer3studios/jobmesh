'use client';
// FILE: src/components/ui/Toast.tsx
// Toast system: <ToastProvider> wraps the app, useToast() pushes messages.
import { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { RADIUS, SHADOW, Z, TYPE } from '../../theme/tokens';

type ToastVariant = 'success' | 'error' | 'info';
interface ToastItem { id: number; variant: ToastVariant; message: string }

interface ToastApi { showToast: (variant: ToastVariant, message: string) => void }
const ToastCtx = createContext<ToastApi | null>(null);

const ICON = { success: CheckCircle2, error: AlertCircle, info: Info };
const COLOR: Record<ToastVariant, string> = { success: 'var(--success)', error: 'var(--danger)', info: 'var(--info)' };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  // The toast overlay portals into document.body, which does not exist during SSR /
  // static prerender. Gate the portal on a client-only mounted flag so the provider
  // renders its children on the server and only mounts the overlay after hydration.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const showToast = useCallback((variant: ToastVariant, message: string) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, variant, message }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 5000);
  }, []);

  return (
    <ToastCtx.Provider value={{ showToast }}>
      {children}
      {mounted && createPortal(
        <div
          aria-live="polite"
          style={{
            position: 'fixed', bottom: 16, right: 16, zIndex: Z.toast,
            display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 'calc(100vw - 32px)',
          }}
        >
          {toasts.map((t) => {
            const Icon = ICON[t.variant];
            return (
              <div
                key={t.id}
                role="status"
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, minWidth: 240, maxWidth: 380,
                  padding: '12px 14px', borderRadius: RADIUS.lg, background: 'var(--surface)',
                  border: '1px solid var(--border)', boxShadow: SHADOW.lg,
                  color: 'var(--ink)', fontSize: TYPE.base, fontWeight: 500,
                  animation: 'toastIn 240ms cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                <Icon size={18} color={COLOR[t.variant]} style={{ flexShrink: 0 }} />
                <span>{t.message}</span>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastCtx.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}
