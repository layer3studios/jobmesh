'use client';
// FILE: src/components/seeker/today/TiltCard.tsx
// A glass card that leans toward the pointer. GSAP quickTo drives rotateX /
// rotateY (a few degrees, perspective on the parent) and a glare that follows
// the cursor; it eases back to flat on leave. Touch and reduced-motion get a
// plain card, nothing lost.
import { createElement, useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import gsap from 'gsap';

interface Props {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Max tilt in degrees. */
  max?: number;
  as?: 'div' | 'a' | 'aside';
  href?: string;
  target?: string;
  rel?: string;
}

export default function TiltCard({ children, className, style, max = 6, as = 'div', href, target, rel }: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduce) return;

    gsap.set(el, { transformPerspective: 900, transformOrigin: '50% 50%', x: 0, y: 0 });
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3.out' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3.out' });
    const gx = gsap.quickTo(el, '--glare-x', { duration: 0.4, ease: 'power2.out' });
    const gy = gsap.quickTo(el, '--glare-y', { duration: 0.4, ease: 'power2.out' });

    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      ry((px - 0.5) * 2 * max);
      rx(-(py - 0.5) * 2 * max);
      gx(px * 100); gy(py * 100);
    };
    const enter = () => { el.dataset.tilt = 'on'; };
    const leave = () => { el.dataset.tilt = 'off'; rx(0); ry(0); gx(50); gy(50); };

    el.addEventListener('pointermove', move);
    el.addEventListener('pointerenter', enter);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerenter', enter);
      el.removeEventListener('pointerleave', leave);
      gsap.killTweensOf(el);
    };
  }, [max]);

  const props: Record<string, unknown> = {
    ref,
    className: `tilt glass${className ? ` ${className}` : ''}`,
    style,
  };
  if (as === 'a') { props.href = href; props.target = target; props.rel = rel; }

  return createElement(
    as,
    props,
    createElement('span', { className: 'tilt__glare', 'aria-hidden': true }),
    children,
  );
}
