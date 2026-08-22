'use client';
// FILE: settings/team/parts/CopyLinkField.tsx
// Read-only input holding an invite URL with a Copy button. Uses the clipboard
// helper (navigator.clipboard + execCommand fallback, D_impl_ui_9).
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { copyToClipboard } from '@/lib/clipboard';

interface Props {
  url: string;
  onCopied: () => void;
}

export default function CopyLinkField({ url, onCopied }: Props) {
  const [justCopied, setJustCopied] = useState(false);

  async function handleCopy() {
    const ok = await copyToClipboard(url);
    if (ok) {
      setJustCopied(true);
      onCopied();
      setTimeout(() => setJustCopied(false), 2000);
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
      <input
        readOnly
        value={url}
        aria-label="Invite link"
        onFocus={(e) => e.currentTarget.select()}
        style={{
          flex: 1, minWidth: 0, padding: '9px 12px', fontSize: '0.85rem',
          border: '1px solid var(--border)', borderRadius: 8,
          background: 'var(--paper-2)', color: 'var(--ink)', fontFamily: 'inherit',
        }}
      />
      <Button variant="secondary" onClick={handleCopy} iconLeft={justCopied ? <Check size={14} /> : <Copy size={14} />}>
        {justCopied ? 'Copied' : 'Copy'}
      </Button>
    </div>
  );
}
