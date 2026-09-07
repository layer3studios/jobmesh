'use client';
// FILE: src/components/seeker/profile/ConnectShell.tsx
// The one frame every proof-of-work connection uses (GitHub, LeetCode,
// LinkedIn): an icon, the service, the handle once connected, a status pill,
// and two boxed actions that look the same so neither reads as an afterthought.
// The connected state opens a vibrant palette for the stats inside it.
import type { ReactNode } from 'react';
import { RefreshCw, Unplug, ExternalLink } from 'lucide-react';
import { Button } from '../../ui';

export function ConnectShell({ icon, name, handle, href, connected, busy, onRefresh, onDisconnect, disconnectLabel = 'Disconnect', children, tone }: {
  icon: ReactNode;
  name: string;
  handle?: string | null;
  /** Where the handle points. */
  href?: string | null;
  connected: boolean;
  busy?: boolean;
  onRefresh?: () => void;
  onDisconnect?: () => void;
  disconnectLabel?: string;
  children: ReactNode;
  /** The hue the connected state glows with. */
  tone: 'github' | 'leetcode' | 'linkedin';
}) {
  return (
    <section className="pf-conn" data-connected={connected ? 'true' : 'false'} data-tone={tone}>
      <header className="pf-conn__head">
        <span className="pf-conn__icon" aria-hidden>{icon}</span>
        <div className="pf-conn__who">
          <h3 className="pf-conn__name">{name}</h3>
          {connected && handle && (
            href
              ? <a className="pf-conn__handle press" href={href} target="_blank" rel="noopener noreferrer">@{handle} <ExternalLink size={11} aria-hidden /></a>
              : <span className="pf-conn__handle">@{handle}</span>
          )}
        </div>
        <span className="pf-conn__status" data-on={connected ? 'true' : 'false'}>
          <span className="pf-conn__dot" aria-hidden />{connected ? 'Connected' : 'Not connected'}
        </span>
        {connected && (onRefresh || onDisconnect) && (
          <div className="pf-conn__actions">
            {onRefresh && <Button variant="secondary" size="sm" disabled={busy} onClick={onRefresh} iconLeft={<RefreshCw size={13} className={busy ? 'pf-spin' : undefined} />}>{busy ? 'Refreshing' : 'Refresh'}</Button>}
            {onDisconnect && <Button variant="secondary" size="sm" disabled={busy} onClick={onDisconnect} iconLeft={<Unplug size={13} />} className="pf-conn__off">{disconnectLabel}</Button>}
          </div>
        )}
      </header>
      <div className="pf-conn__body">{children}</div>
    </section>
  );
}
