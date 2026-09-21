'use client';
// FILE: src/components/seeker/profile/LeetCodeConnect.tsx
// The LeetCode connection on the seeker profile: connect an account, then see
// exactly what an employer will see. The connected state shows the full
// panel, not a teaser: this is where a candidate checks what they publish.

import { useCallback, useEffect, useState } from 'react';
import { Code2, Check } from 'lucide-react';
import { Alert, Button, SkeletonLine } from '@/components/ui';
import { connectLeetCode, disconnectLeetCode, getLeetCodeProfile, refreshLeetCode, SeekerApiError } from '@/api/seeker-api';
import type { LeetCodeProfile } from '@/types/seeker-profile';
import LeetCodeStats from './LeetCodeStats';
import { TextInput } from './editor';
import { ConnectShell } from './ConnectShell';

function relativeTime(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default function LeetCodeConnect() {
  const [data, setData] = useState<LeetCodeProfile | null>(null);
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await getLeetCodeProfile();
      setConnected(result.connected);
      setData(result.data ?? null);
    } catch { setConnected(false); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function run(action: () => Promise<void>) {
    setIsBusy(true); setError(null);
    try { await action(); }
    catch (caught) { setError(caught instanceof SeekerApiError ? caught.message : 'Something went wrong. Try again.'); }
    finally { setIsBusy(false); }
  }

  const handleConnect = () => run(async () => { setData(await connectLeetCode(username.trim())); setConnected(true); setUsername(''); });
  const handleRefresh = () => run(async () => { setData(await refreshLeetCode()); });
  const handleDisconnect = () => run(async () => { await disconnectLeetCode(); setData(null); setConnected(false); });

  if (isLoading) return <div className="pf-conn" aria-busy="true"><div className="pf-conn__head"><SkeletonLine width="45%" height={20} /></div></div>;

  return (
    <ConnectShell
      icon={<Code2 size={17} />}
      name="LeetCode"
      tone="leetcode"
      handle={data?.username}
      href={data?.username ? `https://leetcode.com/u/${data.username}` : null}
      connected={connected}
      busy={isBusy}
      onRefresh={handleRefresh}
      onDisconnect={handleDisconnect}
    >
      {!connected ? (
        <div className="pf-conn__form">
          <p className="pf-conn__text">Connect your account and employers reviewing your application see what you have solved: problems, contests and the topics you are strongest in.</p>
          {error && <Alert type="error">{error}</Alert>}
          <div className="pf-conn__inline">
            <TextInput
              value={username} placeholder="your-leetcode-username" maxLength={20} autoCapitalize="none" spellCheck={false} disabled={isBusy}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && username.trim()) handleConnect(); }}
              aria-label="LeetCode username"
            />
            <Button disabled={isBusy || !username.trim()} onClick={handleConnect} iconLeft={<Check size={13} />}>{isBusy ? 'Checking' : 'Connect'}</Button>
          </div>
        </div>
      ) : (
        <>
          {error && <Alert type="error">{error}</Alert>}
          {data?.isStale && <Alert type="warning">These numbers are from the last successful update. LeetCode could not be reached. Refresh to try again.</Alert>}
          {data ? (
            <>
              <LeetCodeStats data={data} />
              <p className="pf-conn__foot">Updated {relativeTime(data.fetchedAt)} · refreshes daily</p>
            </>
          ) : (
            <p className="pf-conn__text">Connected, but we have not been able to read your stats yet. Try Refresh.</p>
          )}
        </>
      )}
    </ConnectShell>
  );
}
