'use client';
// FILE: src/components/seeker/profile/GitHubConnect.tsx
// The GitHub connection on the seeker profile: connect an account, then see
// exactly what an employer will see.
//
// THE CONNECTED STATE SHOWS THE FULL PANEL, not a teaser. This is the one
// place a candidate can check what they are publishing before a recruiter
// reads it. It also has a state LeetCode's does not: UNAVAILABLE. GitHub needs
// a server token, and when there is none the honest thing is to say so.

import { useCallback, useEffect, useState } from 'react';
import { Github, Check } from 'lucide-react';
import { Alert, Button, SkeletonLine } from '@/components/ui';
import { connectGitHub, disconnectGitHub, getGitHubProfile, refreshGitHub, SeekerApiError } from '@/api/seeker-api';
import type { GitHubProfile } from '@/types/seeker-profile';
import GitHubStats from './GitHubStats';
import { TextInput } from './editor';
import { ConnectShell } from './ConnectShell';

/** "4 hours ago": precise enough to judge freshness, vague enough to stay readable. */
function relativeTime(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export default function GitHubConnect() {
  const [data, setData] = useState<GitHubProfile | null>(null);
  const [connected, setConnected] = useState(false);
  const [available, setAvailable] = useState(true);
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await getGitHubProfile();
      setConnected(result.connected);
      setAvailable(result.available !== false);
      setData(result.data ?? null);
    } catch {
      setConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function run(action: () => Promise<void>) {
    setIsBusy(true); setError(null);
    try { await action(); }
    catch (caught) { setError(caught instanceof SeekerApiError ? caught.message : 'Something went wrong. Try again.'); }
    finally { setIsBusy(false); }
  }

  const handleConnect = () => run(async () => { setData(await connectGitHub(username.trim())); setConnected(true); setUsername(''); });
  const handleRefresh = () => run(async () => { setData(await refreshGitHub()); });
  const handleDisconnect = () => run(async () => { await disconnectGitHub(); setData(null); setConnected(false); });

  if (isLoading) return <div className="pf-conn" aria-busy="true"><div className="pf-conn__head"><SkeletonLine width="45%" height={20} /></div></div>;

  return (
    <ConnectShell
      icon={<Github size={17} />}
      name="GitHub"
      tone="github"
      handle={data?.username}
      href={data?.username ? `https://github.com/${data.username}` : null}
      connected={connected}
      busy={isBusy}
      onRefresh={handleRefresh}
      onDisconnect={handleDisconnect}
    >
      {!available && !connected ? (
        <p className="pf-conn__text">GitHub integration is unavailable right now. Nothing is wrong on your side. Check back later.</p>
      ) : !connected ? (
        <div className="pf-conn__form">
          <p className="pf-conn__text">Connect your account and employers reviewing your application see what you have built: repositories, languages and a year of contributions.</p>
          {error && <Alert type="error">{error}</Alert>}
          <div className="pf-conn__inline">
            <TextInput
              value={username} placeholder="your-github-username" maxLength={39} autoCapitalize="none" autoCorrect="off" spellCheck={false} disabled={isBusy}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && username.trim()) handleConnect(); }}
              aria-label="GitHub username"
            />
            <Button disabled={isBusy || !username.trim()} onClick={handleConnect} iconLeft={<Check size={13} />}>{isBusy ? 'Checking' : 'Connect'}</Button>
          </div>
        </div>
      ) : (
        <>
          {error && <Alert type="error">{error}</Alert>}
          {data?.isStale && <Alert type="warning">These numbers are from the last successful update. GitHub could not be reached. Refresh to try again.</Alert>}
          {data ? (
            <>
              <GitHubStats data={data} />
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
