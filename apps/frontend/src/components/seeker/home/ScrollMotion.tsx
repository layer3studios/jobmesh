'use client';
// FILE: src/components/seeker/home/ScrollMotion.tsx
// Smooth scroll + GSAP/ScrollTrigger choreography for the landing pages.
// Renders nothing; finds its targets by class inside `scope`.
//
// Lenis drives the scroll (inertia, eased wheel) and GSAP's ticker drives
// Lenis, so both share one clock and ScrollTrigger never sees a stale scroll
// position. One gsap.context, one Lenis instance, both torn down on unmount.
//
// The vocabulary, applied everywhere so the pages move as one thing:
//   words   — a statement rises word by word out of clipped lines
//   reveal  — [data-reveal] rises 36px and fades in as it enters
//   beats   — spine beats slide in from their own side of the rail
//   fills   — bars grow from zero when their panel appears
//   ink     — photographs drift slower than the page (parallax)
// prefers-reduced-motion: nothing here runs; native scroll, everything at rest.
import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { scenePointer } from './three/pointer-store';

gsap.registerPlugin(ScrollTrigger);
// On phones the address bar sliding away resizes the viewport; without this
// every slide re-measured every trigger and the page jumped under the thumb.
ScrollTrigger.config({ ignoreMobileResize: true });

const EASE = 'power4.out';

export default function ScrollMotion({ scope }: { scope: string }) {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(scope);
    if (!root) return;
    const media = gsap.matchMedia();

    media.add('(prefers-reduced-motion: no-preference)', () => {
      // Smooth scroll. Touch keeps native scrolling — Lenis only eases wheel
      // and keyboard, so iOS momentum and the dynamic island behave as usual.
      const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95, smoothWheel: true, syncTouch: false });
      lenis.on('scroll', ScrollTrigger.update);
      const tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);

      const context = gsap.context(() => {
        const words = root.querySelectorAll('.hm-word');
        if (words.length) gsap.from(words, { yPercent: 112, opacity: 0, duration: 0.85, ease: EASE, stagger: 0.045 });
        gsap.from(root.querySelectorAll('.hm-hero__badge, .hm-hero__lede, .hm-hero__doors'), {
          y: 22, opacity: 0, duration: 0.75, ease: EASE, stagger: 0.09, delay: 0.3,
        });

        // Hide reveal targets up front. Setting the start state only when a
        // batch entered meant each block painted, blinked out, then rose —
        // a flicker on every section while scrolling.
        //
        // Cards and links carry a CSS `transition: transform, opacity` for
        // hover. Left on, the browser re-eases every value GSAP writes, so the
        // rise lags and wobbles; it is switched off for the tween. At rest the
        // inline transform is cleared too — an inline `translate(0,0)` would
        // outrank `.hm-card:hover` and kill the hover lift.
        const reveals = root.querySelectorAll('[data-reveal]');
        const AT_REST = 'transform,opacity,transition';
        gsap.set(reveals, { y: 36, opacity: 0, transition: 'none' });
        ScrollTrigger.batch(reveals, {
          start: 'top 88%',
          onEnter: batch => gsap.to(batch,
            { y: 0, opacity: 1, duration: 0.95, ease: EASE, stagger: 0.09, overwrite: true, clearProps: AT_REST }),
          // Loaded already scrolled past a block (reload, back button): show it.
          onLeave: batch => gsap.set(batch, { clearProps: AT_REST, overwrite: true }),
          once: true,
        });

        root.querySelectorAll<HTMLElement>('.hm-beat').forEach(beat => {
          const fromLeft = beat.classList.contains('hm-beat--flip');
          gsap.from(beat.querySelectorAll('.hm-beat__copy, .hm-beat__visual'), {
            x: (index: number) => ((index === 0) === fromLeft ? 48 : -48),
            opacity: 0, duration: 1, ease: EASE, stagger: 0.1,
            scrollTrigger: { trigger: beat, start: 'top 80%', once: true },
          });
        });

        root.querySelectorAll<HTMLElement>('.hm-panel, .hm-viz').forEach(panel => {
          const fills = panel.querySelectorAll('.hm-bar__fill, .hm-band__fill, .hm-rank__fill');
          if (!fills.length) return;
          gsap.from(fills, {
            scaleX: 0, transformOrigin: 'left center', duration: 1.3, ease: EASE, stagger: 0.08,
            scrollTrigger: { trigger: panel, start: 'top 82%', once: true },
          });
        });

        root.querySelectorAll<HTMLElement>('.hm-ink--band .hm-ink__img, .hm-ink--final .hm-ink__img').forEach(img => {
          gsap.fromTo(img, { yPercent: -8 }, {
            yPercent: 8, ease: 'none',
            scrollTrigger: { trigger: img.closest('section, div') ?? img, start: 'top bottom', end: 'bottom top', scrub: 0.4 },
          });
        });

        // In-page links (/hire's "#how") go through Lenis. A native fragment
        // jump mid-glide was overwritten by Lenis on the next frame, so the
        // page snapped down, then back, then glided. Lenis honours the
        // targets' scroll-margin-top (home-motion.css), which clears the nav.
        const onAnchorClick = (event: MouseEvent) => {
          if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          const link = (event.target as Element | null)?.closest?.('a[href^="#"]');
          const hash = link?.getAttribute('href');
          const target = hash && hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
          if (!target) return;
          event.preventDefault();
          lenis.scrollTo(target);
          history.replaceState(history.state, '', hash);
        };
        root.addEventListener('click', onAnchorClick);

        const nav = root.querySelector('.hm-nav');
        if (nav) ScrollTrigger.create({ start: 40, onToggle: self => nav.classList.toggle('hm-nav--scrolled', self.isActive) });

        // The 3D scene's scroll-sink is driven from HERE, not from a raw window
        // scroll listener: iOS Safari fires `scroll` unreliably through
        // rubber-band and momentum phases, so the object used to freeze mid-way
        // on a phone. ScrollTrigger already normalises all of that.
        const hero = root.querySelector('.hm-hero, .lp-hero, .hr-hero');
        if (hero) {
          ScrollTrigger.create({
            trigger: hero, start: 'top top', end: 'bottom top', scrub: true,
            onUpdate: self => { scenePointer.scrollProgress = self.progress; },
          });
        }
        return () => root.removeEventListener('click', onAnchorClick);
      }, root);

      return () => {
        context.revert();
        gsap.ticker.remove(tick);
        lenis.destroy();
      };
    });

    return () => media.revert();
  }, [scope]);

  return null;
}
