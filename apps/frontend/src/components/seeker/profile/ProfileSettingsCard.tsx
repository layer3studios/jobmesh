'use client';
// FILE: src/components/seeker/profile/ProfileSettingsCard.tsx
// "Public profile" on the seeker's own (private) profile page: the switch that
// turns /u/{slug} on, and everything that controls what it shows.
//
// THE SERVER'S ANSWER IS THE STATE. Every change PATCHes and the response
// replaces local state, so the slug the backend generated, or the flag it
// refused, is what the card shows — never an optimistic value that quietly
// disagrees with the page a recruiter would load. Toggles are debounced
// (one second) so dragging through five checkboxes is one request, not five.
// The headline is edited in Basic information, not here.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import { Card, Button, Switch, Alert, Stack, useToast } from '../../ui';
import VisibilityMenu from './VisibilityMenu';
import {
  fetchProfileSettings, patchProfileSettings, PublicProfileApiError,
} from '../../../api/public-profile-api';
import type { ProfileSettingsPatch } from '../../../api/public-profile-api';
import type {
  PublicProfileSettingsState, ProfileVisibilitySettings,
} from '../../../types/public-profile';
import { copyToClipboard } from '../../../lib/clipboard';
import ProfileSlugField from './ProfileSlugField';
import ProfileVisibilityToggles from './ProfileVisibilityToggles';

const AUTOSAVE_MS = 1000;

export default function ProfileSettingsCard() {
  const { showToast } = useToast();
  const [state, setState] = useState<PublicProfileSettingsState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef<Partial<ProfileVisibilitySettings>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchProfileSettings().then(setState).catch(() => setError('Could not load your public profile settings.'));
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);

  const save = useCallback(async (patch: ProfileSettingsPatch) => {
    setError(null);
    try {
      setState(await patchProfileSettings(patch));
      showToast('success', 'Saved');
    } catch (err) {
      if (err instanceof PublicProfileApiError) {
        const suggestion = err.details?.suggestions?.[0];
        setError(suggestion ? `${err.message} Try ${suggestion}.` : err.message);
      } else {
        setError('Could not save. Please try again.');
      }
      // Re-read so the card stops showing a value the server rejected.
      fetchProfileSettings().then(setState).catch(() => {});
    }
  }, [showToast]);

  /** Apply a settings change locally at once, and flush it after a quiet second. */
  const queueSettings = (patch: Partial<ProfileVisibilitySettings>) => {
    setState((current) => (current ? { ...current, settings: { ...current.settings, ...patch } } : current));
    pending.current = { ...pending.current, ...patch };
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const profileSettings = pending.current;
      pending.current = {};
      void save({ profileSettings });
    }, AUTOSAVE_MS);
  };

  const copyUrl = async () => {
    if (!state?.profileUrl) return;
    const copied = await copyToClipboard(state.profileUrl);
    showToast(copied ? 'success' : 'error', copied ? 'Link copied' : 'Could not copy the link');
  };

  if (!state) {
    return (
      <Card>
        <Stack gap={8}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' }}>Public profile</h3>
          {error ? <Alert type="error">{error}</Alert>
            : <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>Loading…</p>}
        </Stack>
      </Card>
    );
  }

  return (
    <Card>
      <Stack gap={14}>
        <Stack gap={8} dir="row" align="center" justify="space-between" wrap>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' }}>Public profile</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', marginTop: 2 }}>
              One link that replaces your resume for cold outreach.
            </p>
          </div>
          <VisibilityMenu
            value={state.profileVisibility}
            onChange={(profileVisibility) => void save({ profileVisibility })}
          />
        </Stack>

        {error && <Alert type="error">{error}</Alert>}

        {!state.profilePublic ? (
          <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)' }}>
            Your profile is private. Set it to public or recruiters-only to get a shareable link.
          </p>
        ) : (
          <Stack gap={16}>
            <Stack gap={8} dir="row" align="center" wrap>
              <code style={{
                flex: '1 1 240px', padding: '8px 10px', borderRadius: 8, fontSize: '0.8125rem',
                background: 'var(--surface-sunken)', color: 'var(--ink)', overflowWrap: 'anywhere',
              }}>
                {state.profileUrl}
              </code>
              <Button variant="secondary" size="sm" onClick={() => void copyUrl()}>
                <Copy size={14} /> Copy
              </Button>
              {state.profileUrl && (
                <a href={state.profileUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm">
                    <ExternalLink size={14} /> Open
                  </Button>
                </a>
              )}
            </Stack>

            <ProfileSlugField
              slug={state.profileSlug ?? ''}
              onCommit={(profileSlug) => void save({ profileSlug })}
            />

            <Switch
              label="Open to work"
              checked={state.settings.openToWork}
              onChange={(openToWork) => queueSettings({ openToWork })}
            />

            <ProfileVisibilityToggles
              settings={state.settings}
              available={state}
              onChange={queueSettings}
            />

            {state.profileVisibility === 'recruiters' && (
              <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', margin: 0 }}>
                Anyone who is not a signed-in employer sees nothing at this link, the same
                as if the page did not exist. It is also kept out of search engines.
              </p>
            )}

            <p style={{ fontSize: '0.8125rem', color: 'var(--ink-muted)', margin: 0 }}>
              {state.profileViewCount === 0
                ? 'No views yet — share the link to get started.'
                : `Your profile has been viewed ${state.profileViewCount.toLocaleString()} ${state.profileViewCount === 1 ? 'time' : 'times'}.`}
            </p>
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
