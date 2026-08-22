'use client';
// FILE: src/components/employer/jobs/KeyboardShortcutsHelp.tsx
// The "?" affordance beside the ranked toolbar and the modal it opens. The list is
// declared once here and is the only place shortcuts are described, so the help can
// never drift from useRankedKeyboard without someone noticing both files.

import { useState } from 'react';
import { Modal, Stack } from '@/components/ui';

const SHORTCUTS: Array<{ keys: string[]; description: string }> = [
  { keys: ['↑', '↓'], description: 'Move between candidates' },
  { keys: ['j', 'k'], description: 'Move between candidates' },
  { keys: ['Enter'], description: 'Open the highlighted candidate' },
  { keys: ['a'], description: 'Archive the highlighted candidate' },
  { keys: ['m'], description: 'Move the highlighted candidate to another stage' },
  { keys: ['s'], description: 'Select or deselect the highlighted candidate' },
  { keys: ['Esc'], description: 'Close a menu, or clear the highlight' },
  { keys: ['?'], description: 'Show this list' },
];

const KEY_STYLE: React.CSSProperties = {
  display: 'inline-block', minWidth: 22, padding: '2px 6px', textAlign: 'center',
  borderRadius: 6, border: '1px solid var(--border-strong)', background: 'var(--surface-raised)',
  fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink)',
};

export default function KeyboardShortcutsHelp({ isOpen, onOpen, onClose }: {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <button
        type="button" onClick={onOpen} aria-label="Keyboard shortcuts"
        title="Keyboard shortcuts"
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 24, height: 24, borderRadius: 999, cursor: 'pointer',
          border: '1px solid var(--border)', background: 'transparent',
          color: 'var(--ink-muted)', fontSize: '0.75rem', fontWeight: 700,
        }}
      >
        ?
      </button>
      <Modal isOpen={isOpen} onClose={onClose} title="Keyboard shortcuts" size="sm">
        <Stack gap={8}>
          {SHORTCUTS.map((shortcut) => (
            <div key={shortcut.description + shortcut.keys.join('')}
              style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ display: 'inline-flex', gap: 4, width: 76, flexShrink: 0 }}>
                {shortcut.keys.map((key) => <kbd key={key} style={KEY_STYLE}>{key}</kbd>)}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--ink-muted)' }}>{shortcut.description}</span>
            </div>
          ))}
          <p style={{ margin: '4px 0 0', fontSize: '0.76rem', color: 'var(--ink-faint)' }}>
            Shortcuts pause while you’re typing in a field.
          </p>
        </Stack>
      </Modal>
    </>
  );
}

/** Convenience state for callers that just want the pair. */
export function useShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);
  return { isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) };
}
