'use client';
// FILE: src/components/seeker/CompanyLogo.tsx
// Resolves a company's logo via ATS slug → guessed domain → Clearbit autocomplete → logo.dev.
// API surface preserved; visual shell modernized.

import { useState, useMemo, useEffect, useRef } from 'react';
import { Building2 } from 'lucide-react';
import {
  getDomainFromUrl, cleanCompanyName, slugify, slugFromAtsUrl, isAtsHost,
  resolveDomainViaAutocomplete, logoDevUrl, preloadImg, companyInitial,
} from './company-logo-helpers';

interface Props {
  name?: string;
  url?: string | null;
  domain?: string | null;
  size?: number;
  borderRadius?: number | string;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}


export default function CompanyLogo({ name, url, domain, size = 40, borderRadius = 10, className, style, alt }: Props) {
  const host = useMemo(() => domain || getDomainFromUrl(url || ''), [domain, url]);
  const mountRef = useRef(true);

  const candidates = useMemo(() => {
    const list: string[] = [];
    if (url) {
      const slug = slugFromAtsUrl(url);
      if (slug) list.push(`${slug}.com`);
    }
    if (host && !isAtsHost(host)) list.push(host);
    if (name) {
      const clean = cleanCompanyName(name);
      const slug = slugify(clean);
      if (slug && slug.length >= 2 && slug.length < 25) {
        list.push(`${slug}.com`); list.push(`${slug}.co`); list.push(`${slug}.io`); list.push(`${slug}.in`);
      }
    }
    return [...new Set(list)];
  }, [host, url, name]);

  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    setLogoSrc(null); setResolved(false);
    mountRef.current = true;
    return () => { mountRef.current = false; };
  }, [name, url, domain]);

  useEffect(() => {
    if (resolved) return;
    let done = false;
    let guessedSrc: string | null = null;

    const tryDomain = async (d: string, isAutocomplete = false) => {
      const src = logoDevUrl(d);
      const ok = await preloadImg(src);
      if (!ok || !mountRef.current) return;
      if (isAutocomplete) {
        done = true; setLogoSrc(src); setResolved(true);
      } else if (!done) {
        guessedSrc = src; setLogoSrc(src);
      }
    };

    candidates.forEach(d => tryDomain(d, false));
    if (name) {
      resolveDomainViaAutocomplete(name).then(d => {
        if (d && mountRef.current) {
          const acSrc = logoDevUrl(d);
          if (acSrc === guessedSrc) { done = true; setResolved(true); }
          else tryDomain(d, true);
        }
      });
    }
    const timer = setTimeout(() => {
      if (!done && mountRef.current) {
        done = true;
        if (guessedSrc) setLogoSrc(guessedSrc);
        setResolved(true);
      }
    }, 6000);
    return () => { clearTimeout(timer); done = true; };
  }, [candidates, name, resolved]);

  const containerStyle: React.CSSProperties = {
    width: size, height: size, borderRadius,
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', position: 'relative',
    padding: Math.round(size * 0.12),
    boxSizing: 'border-box',
    ...style,
  };

  const initial = useMemo(() => companyInitial(name, host), [name, host]);

  const letterEl = (opacity = 1) => (
    initial ? (
      <span style={{
        fontFamily: 'var(--font-serif)',
        fontSize: size * 0.5,
        color: 'var(--accent)',
        fontWeight: 600,
        lineHeight: 1,
        opacity,
      }}>
        {initial}
      </span>
    ) : (
      <Building2 size={size * 0.5} style={{ color: 'var(--ink-faint)', opacity }} />
    )
  );

  return (
    <div className={className} style={containerStyle} aria-label={alt || name || 'company logo'}>
      {logoSrc ? (
        <img
          src={logoSrc}
          alt={alt || name}
          referrerPolicy="no-referrer"
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
          onError={() => { setLogoSrc(null); setResolved(true); }}
        />
      ) : resolved ? letterEl() : letterEl(0.45)}
    </div>
  );
}
