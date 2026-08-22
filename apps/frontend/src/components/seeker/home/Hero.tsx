'use client';
// FILE: src/components/seeker/home/Hero.tsx
// Section 2 — THE focal point. Centre-aligned throughout: badge, headline,
// subtitle, search and tags all sit on the page's axis, which kills the dead
// zone a left-aligned hero leaves on the right.
//
// Client component because the search field owns input state and pushes to
// /jobs?q=… (the param the jobs Dashboard reads). useRouter is only touched
// inside handlers, so nothing here runs during SSR.
import { useState, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, MapPin, ChevronDown } from 'lucide-react';
import { COPY } from '../../../theme/brand';
import type { HomeCounts } from './shared';

/** Strip tags, trim, then URL-encode. Empty input must never navigate. */
function sanitizeQuery(raw: string): string | null {
  const cleaned = raw.trim().replace(/<[^>]*>/g, '').trim();
  return cleaned ? encodeURIComponent(cleaned) : null;
}

export default function Hero({ counts }: { counts: HomeCounts }) {
  const router = useRouter();
  const [value, setValue] = useState('');

  const submit = () => {
    const q = sanitizeQuery(value);
    if (!q) return; // empty / tags-only submit is a no-op
    router.push(`/jobs?q=${q}`);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); submit(); }
  };

  const badgeText = counts.todayCount > 0
    ? `${counts.todayCount} ${COPY.home.rolesAddedToday}`
    : COPY.home.rolesAddedDaily;

  return (
    <section className="hm-section hm-hero" aria-labelledby="hero-heading">
      {/* Atmospheric depth only — clipped by the hero's overflow:hidden and
          held behind the content by z-index, so it can never catch a click. */}
      <div className="hm-hero__texture" aria-hidden="true">
        <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.35 }} />
        <div className="orb hm-orb" style={{ width: 380, height: 380, top: -140, left: -120, background: 'var(--accent)' }} />
        <div className="orb hm-orb" style={{ width: 340, height: 340, top: -110, right: -110, background: 'var(--info)' }} />
      </div>

      <div className="hm-hero__badge hm-mono anim-up">
        <span className="hm-hero__dot" aria-hidden="true" />
        {badgeText}
      </div>

      <h1 id="hero-heading" className="font-display hm-hero__title anim-up hm-d1">
        {COPY.home.heroHeadPrefix} <em>{COPY.home.heroHeadAccent}</em> {COPY.home.heroHeadSuffix}
      </h1>

      <p className="hm-hero__sub anim-up hm-d2">
        {COPY.home.heroSubtitleBase} — {COPY.home.noAccountRequired}.
      </p>

      {/* Input + location + button read as ONE object: the shell owns the
          border, shadow and focus ring; the children are borderless. */}
      <div className="hm-search anim-up hm-d3">
        <div className="hm-search__field">
          <Search size={16} style={{ color: 'var(--ink-faint)', flexShrink: 0 }} aria-hidden="true" />
          <input
            className="hm-search__input"
            type="search"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={COPY.home.searchPlaceholder}
            aria-label={COPY.home.searchAriaLabel}
          />
        </div>

        <span className="hm-search__divider" aria-hidden="true" />

        {/* Single-value affordance today — every listing is in India. Clicking
            opens the unfiltered feed; a real location filter is future work. */}
        <button
          type="button"
          className="hm-search__loc hm-mono"
          aria-label={COPY.home.locationAriaLabel}
          onClick={() => router.push('/jobs')}
        >
          <MapPin size={13} style={{ color: 'var(--ink-faint)', flexShrink: 0 }} aria-hidden="true" />
          {COPY.home.locationDefault}
          <ChevronDown size={11} style={{ color: 'var(--ink-faint)', flexShrink: 0 }} aria-hidden="true" />
        </button>

        <button type="button" className="hm-search__btn" onClick={submit}>
          <Search size={14} aria-hidden="true" />
          {COPY.home.searchButton}
        </button>
      </div>

      {/* Reads as the console's suggestion row rather than a tag cloud. */}
      <div className="hm-tags anim-up hm-d4">
        <span className="hm-tags__label hm-mono">{COPY.home.quickFiltersLabel}</span>
        {COPY.home.quickFilters.map(tag => (
          <Link key={tag} href={`/jobs?q=${encodeURIComponent(tag)}`} className="hm-tag hm-mono">
            {tag}
          </Link>
        ))}
      </div>
    </section>
  );
}
