'use client';
// FILE: src/components/seeker/profile/GitHubConnect.tsx
// The GitHub card on the seeker profile: connect an account, then see exactly what
// an employer will see.
//
// THE CONNECTED STATE SHOWS THE FULL PANEL, not a teaser. This is the one place a
// candidate can check what they are publishing before a recruiter reads it, and a
// summary here would defeat that.
//
// It also has a state LeetCode's card does not: UNAVAILABLE. GitHub needs a server
// token, and when there is none the honest thing is to say so rather than offer a
// form that can only fail.

import { useCallback, useEffect, useState } from 'react';
import { Github, RefreshCw } from 'lucide-react';
import { Alert, Button, Card, Input, Stack, SkeletonLine } from '@/components/ui';
import {
  connectGitHub, disconnectGitHub, getGitHubProfile, refreshGitHub, SeekerApiError,
} from '@/api/seeker-api';
import type { GitHubProfile } from '@/types/seeker-profile';
import GitHubStats from './GitHubStats';

/** "4 hours ago" — precise enough to judge freshness, vague enough to stay readable. */
function relativeTime(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function Heading({ username }: { username?: string }) {
  return (
    <Stack gap={9} dir="row" align="center">
      <Github size={17} aria-hidden="true" style={{ color: 'var(--accent)' }} />
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' }}>
        GitHub
        {username && <span style={{ color: 'var(--ink-faint)', fontWeight: 400 }}> · @{username}</span>}
      </h3>
    </Stack>
  );
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
      // A failed read is not an error the candidate can act on — the card simply
      // offers to connect, which is the right next step either way.
      setConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function run(action: () => Promise<void>) {
    setIsBusy(true);
    setError(null);
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof SeekerApiError ? caught.message : 'Something went wrong. Try again.');
    } finally {
      setIsBusy(false);
    }
  }

  const handleConnect = () => run(async () => {
    const profile = await connectGitHub(username.trim());
    setData(profile);
    setConnected(true);
    setUsername('');
  });

  const handleRefresh = () => run(async () => { setData(await refreshGitHub()); });

  const handleDisconnect = () => run(async () => {
    await disconnectGitHub();
    setData(null);
    setConnected(false);
  });

  if (isLoading) return <Card><SkeletonLine width="45%" height={20} /></Card>;

  // Not configured on this server. Say so plainly rather than showing a form whose
  // only possible outcome is a 503 the candidate cannot do anything about.
  if (!available && !connected) {
    return (
      <Card>
        <Stack gap={10}>
          <Heading />
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ink-muted)' }}>
            GitHub integration is unavailable right now. Nothing is wrong on your side —
            check back later.
          </p>
        </Stack>
      </Card>
    );
  }

  if (!connected) {
    return (
      <Card>
        <Stack gap={12}>
          <Heading />
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ink-muted)', maxWidth: '58ch' }}>
            Connect your account and employers reviewing your application can see what
            you have built — repositories, languages and a year of contributions.
          </p>
          {error && <Alert type="error">{error}</Alert>}
          <Stack gap={8} dir="row" align="flex-end" wrap>
            <div style={{ flex: '1 1 200px', minWidth: 0 }}>
              <Input
                label="GitHub username"
                value={username}
                placeholder="your-username"
                maxLength={39}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                disabled={isBusy}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && username.trim()) handleConnect(); }}
              />
            </div>
            <Button disabled={isBusy || !username.trim()} onClick={handleConnect}>
              {isBusy ? 'Checking…' : 'Connect'}
            </Button>
          </Stack>
        </Stack>
      </Card>
    );
  }

  return (
    <Card>
      <Stack gap={14}>
        <Stack gap={10} dir="row" align="center" wrap>
          <Heading username={data?.username} />
          <span style={{ flex: 1 }} />
          <Button variant="ghost" size="sm" disabled={isBusy} onClick={handleRefresh}>
            <Stack gap={6} dir="row" align="center">
              <RefreshCw size={13} aria-hidden="true" />
              {isBusy ? 'Refreshing…' : 'Refresh'}
            </Stack>
          </Button>
          <Button variant="link" size="sm" disabled={isBusy} onClick={handleDisconnect}>
            Disconnect
          </Button>
        </Stack>

        {error && <Alert type="error">{error}</Alert>}
        {data?.isStale && (
          <Alert type="warning">
            These numbers are from the last successful update — GitHub could not be
            reached. Refresh to try again.
          </Alert>
        )}

        {data ? (
          <>
            <GitHubStats data={data} />
            <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--ink-faint)' }}>
              Updated {relativeTime(data.fetchedAt)} · refreshes daily
            </p>
          </>
        ) : (
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ink-muted)' }}>
            Connected, but we have not been able to read your stats yet. Try Refresh.
          </p>
        )}
      </Stack>
    </Card>
  );
}
