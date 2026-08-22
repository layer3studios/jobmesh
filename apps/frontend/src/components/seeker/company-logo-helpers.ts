// FILE: src/components/seeker/company-logo-helpers.ts
// Pure helpers + caches for CompanyLogo. Extracted so the component file stays slim.

export const LOGODEV_TOKEN = process.env.NEXT_PUBLIC_LOGODEV_TOKEN || '';

export const domainCache = new Map<string, string | null>();
export const pendingDomain = new Map<string, Promise<string | null>>();
export const imgStatusCache = new Map<string, boolean>();

export function getDomainFromUrl(url?: string | null): string | null {
  if (!url) return null;
  try { return new URL(url).hostname.replace(/^www\./i, ''); }
  catch {
    try { return (url || '').trim().replace(/^https?:\/\//i, '').split('/')[0].replace(/^www\./i, ''); }
    catch { return null; }
  }
}

export function cleanCompanyName(raw: string): string {
  let s = raw.replace(/\s*\(.*?\)\s*/g, '').replace(/\s*-\s*\d+\s*$/, '').trim();
  const noise = ['international', 'incorporated', 'corporation', 'technologies', 'laboratories',
    'consulting', 'solutions', 'private', 'limited', 'services', 'company',
    'global', 'india', 'group', 'tech', 'pvt', 'ltd', 'inc', 'corp',
    'llc', 'llp', 'gmbh', 'co'];
  const noiseRe = new RegExp(`\\b(${noise.join('|')})\\b\\.?`, 'gi');
  s = s.replace(noiseRe, '').replace(/\s{2,}/g, ' ').trim();
  const words = s.split(/\s+/).filter(w => w.length >= 2 && !/^\d+$/.test(w));
  if (words.length > 0) s = words.join(' ');
  return s;
}

export function slugify(s: string): string { return s.toLowerCase().replace(/[^a-z0-9]+/g, ''); }

export function slugFromAtsUrl(url: string): string | null {
  const ats = /greenhouse|lever|workable|recruitee|ashby|boards/i;
  try {
    const u = new URL(url);
    if (!ats.test(u.hostname)) return null;
    const skip = new Set(['jobs', 'job', 'companies', 'company', 'careers', 'openings', 'positions', 'embed', 'apply']);
    for (const seg of u.pathname.split('/').filter(Boolean)) {
      const lo = seg.toLowerCase();
      if (!skip.has(lo) && /^[a-z][a-z0-9-]{1,30}$/.test(lo)) return lo;
    }
  } catch { /* ignore */ }
  return null;
}

export function isAtsHost(host: string): boolean {
  return /greenhouse|lever|workable|recruitee|ashby|boards|indeed|monster|ziprecruiter|jobs\.|naukri|linkedin/i.test(host);
}

export async function resolveDomainViaAutocomplete(name: string): Promise<string | null> {
  const clean = cleanCompanyName(name);
  if (!clean || clean.length < 2) return null;
  const key = clean.toLowerCase();
  if (domainCache.has(key)) return domainCache.get(key) ?? null;
  if (pendingDomain.has(key)) return pendingDomain.get(key)!;

  const p = (async () => {
    try {
      const res = await fetch(`https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(clean)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0 && data[0].domain) {
          domainCache.set(key, data[0].domain);
          return data[0].domain as string;
        }
      }
    } catch { /* CORS or net */ }
    domainCache.set(key, null);
    return null;
  })();
  pendingDomain.set(key, p);
  const r = await p;
  pendingDomain.delete(key);
  return r;
}

export function logoDevUrl(domain: string): string {
  // fallback=404 → logo.dev returns 404 (not a faint/invisible monogram) when it
  // has no real logo, so our own high-contrast letter fallback renders instead.
  return `https://img.logo.dev/${domain}?token=${LOGODEV_TOKEN}&size=128&format=png&fallback=404`;
}

// Resolves a display initial that survives messy data: trims whitespace and
// leading non-alphanumerics from the name, then falls back to the domain.
export function companyInitial(name?: string | null, domain?: string | null): string | null {
  const fromName = (name || '').trim().replace(/^[^\p{L}\p{N}]+/u, '');
  if (fromName) return fromName.charAt(0).toUpperCase();
  const fromDomain = (domain || '').replace(/^[^a-z0-9]+/i, '');
  if (fromDomain) return fromDomain.charAt(0).toUpperCase();
  return null;
}

export function preloadImg(src: string): Promise<boolean> {
  if (imgStatusCache.has(src)) return Promise.resolve(imgStatusCache.get(src)!);
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => { imgStatusCache.set(src, true); resolve(true); };
    img.onerror = () => { imgStatusCache.set(src, false); resolve(false); };
    img.src = src;
  });
}
