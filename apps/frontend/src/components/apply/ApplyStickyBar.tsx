'use client';
// FILE: src/components/apply/ApplyStickyBar.tsx
// The fixed bottom apply bar, on desktop AND mobile.
//
// It owns NO submit logic. `onSubmit` is the very same handler the in-form button
// calls, so the in-flight guard in ApplyFormClient covers both entry points and a
// click here can never race a click there. There is deliberately no second submit
// function to keep in sync — see the ONE SUBMIT PATH rule.
//
// Width is NOT read in JavaScript here. Everything responsive about this bar (the
// title showing on desktop only) is a media query in apply.css. The observer below
// watches an ELEMENT, not a viewport size.

import { useEffect, useState } from 'react';
import type { RefObject } from 'react';
import { Button } from '@/components/ui';

/**
 * How far down the page counts as "past the header". Below this the bar stays
 * hidden, so it never covers content on first paint before anyone has scrolled.
 */
const SCROLLED_PAST_HEADER_PIXELS = 120;

interface Props {
  jobTitle: string;
  /** The in-form submit button. The bar hides itself whenever this is on screen. */
  submitButtonRef: RefObject<HTMLElement | null>;
  submitting: boolean;
  disabled: boolean;
  /** Already computed by ApplyFormClient — never recomputed here. */
  blockedReason: string | null;
  onSubmit: () => void;
}

export default function ApplyStickyBar({
  jobTitle, submitButtonRef, submitting, disabled, blockedReason, onSubmit,
}: Props) {
  // Starts true so the bar does not flash on first paint before the observer has
  // had a chance to report on a button that is, at that moment, usually visible.
  const [submitInView, setSubmitInView] = useState(true);
  const [scrolledPastHeader, setScrolledPastHeader] = useState(false);
  // HYDRATION. `typeof IntersectionObserver` is always 'undefined' on the server
  // and 'function' in a real browser, so reading it during the first render made
  // the server emit the bar and the client's first pass omit it — a guaranteed
  // hydration mismatch on every apply page. The bar is client-only chrome: it
  // renders nothing until mounted, and then decides. This does NOT weaken the
  // no-IntersectionObserver fallback, which is a client-side question and is
  // still answered on the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const observable = typeof IntersectionObserver !== 'undefined';

  useEffect(() => {
    if (!observable) return;
    const target = submitButtonRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => { for (const entry of entries) setSubmitInView(entry.isIntersecting); },
      { threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [observable, submitButtonRef]);

  useEffect(() => {
    if (!observable) return;
    const onScroll = () => setScrolledPastHeader(window.scrollY > SCROLLED_PAST_HEADER_PIXELS);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [observable]);

  // THE guard. The bar and the in-form button are never on screen together,
  // because the only way `visible` is true with a live observer is for the button
  // to be out of view. Where IntersectionObserver does not exist we cannot know,
  // and an always-visible bar is the safe failure: a candidate who can see two
  // submit buttons is inconvenienced, one who can see none is stuck.
  const visible = mounted && (!observable || (scrolledPastHeader && !submitInView));
  if (!visible) return null;

  return (
    <div className="apply-sticky-bar" data-testid="apply-sticky-bar">
      <span className="apply-sticky-title">{jobTitle}</span>
      <div className="apply-sticky-actions">
        {blockedReason && <span className="apply-sticky-reason">{blockedReason}</span>}
        <Button loading={submitting} disabled={disabled} onClick={onSubmit}>
          Submit application
        </Button>
      </div>
    </div>
  );
}
