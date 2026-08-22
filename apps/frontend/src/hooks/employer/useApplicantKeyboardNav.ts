'use client';
// FILE: src/hooks/employer/useApplicantKeyboardNav.ts
// Keyboard prev/next/back for the applicant detail page (PP2/D1, R1). ArrowLeft →
// prev, ArrowRight → next, Escape → back. A null handler means the direction is
// unavailable (button disabled) and the key is a no-op. Typing in an input/textarea/
// select or a contentEditable region is ignored (R2) so ArrowRight while writing a
// note never jumps applicants; modifier chords (e.g. Ctrl+ArrowLeft = browser back)
// are left to the browser. No third-party dependency (C9).

import { useEffect, useRef } from 'react';

interface NavHandlers {
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
  onEscape?: () => void;
}

/** True when focus is in a text-entry control, where arrow keys move the caret. */
function isTypingInInput(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return target.closest('[contenteditable="true"]') !== null; // walks up ancestors (D1)
}

export function useApplicantKeyboardNav(handlers: NavHandlers): void {
  // Bind the window listener ONCE and read the latest handlers via a ref. onPrev/onNext
  // flip from null to real callbacks when the applicant list loads asynchronously; a
  // deps-based effect can leave a stale listener bound to the pre-load (null) handlers,
  // so the ref keeps the single listener always current.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      if (isTypingInInput(event.target)) return;
      const { onPrev, onNext, onEscape } = handlersRef.current;
      if (event.key === 'ArrowLeft' && onPrev) {
        event.preventDefault();
        onPrev();
      } else if (event.key === 'ArrowRight' && onNext) {
        event.preventDefault();
        onNext();
      } else if (event.key === 'Escape' && onEscape) {
        event.preventDefault();
        onEscape();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}

export default useApplicantKeyboardNav;
