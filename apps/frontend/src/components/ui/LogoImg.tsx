'use client';
import { useState, useEffect } from 'react';

const logoCache = new Map<string, string | null>();

interface Props { companyName: string; size?: number; }

export function LogoImg({ companyName, size = 44 }: Props) {
  const [logoUrl, setLogoUrl] = useState<string | null>(logoCache.get(companyName) ?? null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (failed || logoUrl) return;
    if (logoCache.has(companyName)) {
      const cached = logoCache.get(companyName);
      if (cached) setLogoUrl(cached); else setFailed(true);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const q = encodeURIComponent(companyName.trim());
        const res = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${q}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0 && data[0].logo) {
            const url = data[0].logo;
            logoCache.set(companyName, url);
            if (mounted) setLogoUrl(url);
            return;
          }
        }
        logoCache.set(companyName, null);
        if (mounted) setFailed(true);
      } catch {
        logoCache.set(companyName, null);
        if (mounted) setFailed(true);
      }
    })();
    return () => { mounted = false; };
  }, [companyName, failed, logoUrl]);

  if (!logoUrl || failed) {
    return (
      <span style={{
        fontSize: size * 0.5, color: 'var(--accent)', fontWeight: 700,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '100%', height: '100%',
        fontFamily: 'var(--font-serif)',
      }}>
        {companyName.charAt(0).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={companyName}
      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
      onError={() => { setFailed(true); logoCache.set(companyName, null); }}
    />
  );
}
