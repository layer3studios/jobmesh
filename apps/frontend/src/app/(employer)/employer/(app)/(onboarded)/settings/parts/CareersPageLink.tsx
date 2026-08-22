'use client';
// FILE: settings/parts/CareersPageLink.tsx
// The company's public careers URL (/apply/{slug}) with Copy + Visit. Shared by
// the Company and Branding pages. The origin comes from NEXT_PUBLIC_SITE_URL
// when configured (C10) and falls back to the live origin in the browser.

import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui';
import { copyToClipboard } from '@/lib/clipboard';
import { SITE_URL } from '@/lib/site-url';

export function careersPageUrl(slug: string): string {
  const origin = SITE_URL || (typeof window === 'undefined' ? '' : window.location.origin);
  return `${origin}/apply/${slug}`;
}

export default function CareersPageLink({ slug, onCopied }: {
  slug: string;
  onCopied?: () => void;
}) {
  const [justCopied, setJustCopied] = useState(false);
  const url = careersPageUrl(slug);

  async function handleCopy() {
    if (!(await copyToClipboard(url))) return;
    setJustCopied(true);
    onCopied?.();
    setTimeout(() => setJustCopied(false), 2000);
  }

  return (
    <div>
      <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>Your careers page</p>
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch', flexWrap: 'wrap' }}>
        <input
          readOnly
          value={url}
          aria-label="Careers page URL"
          onFocus={(event) => event.currentTarget.select()}
          style={{
            flex: 1, minWidth: 240, padding: '9px 12px', fontSize: 13,
            border: '1px solid var(--border)', borderRadius: 8,
            background: 'var(--paper-2)', color: 'var(--ink)', fontFamily: 'inherit',
          }}
        />
        <Button
          variant="secondary"
          onClick={handleCopy}
          iconLeft={justCopied ? <Check size={14} /> : <Copy size={14} />}
        >
          {justCopied ? 'Copied' : 'Copy'}
        </Button>
        <Button
          variant="ghost"
          as="a"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          iconLeft={<ExternalLink size={14} />}
        >
          Visit
        </Button>
      </div>
      <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--ink-faint)' }}>
        Share this link so candidates can browse all your active jobs.
      </p>
    </div>
  );
}
