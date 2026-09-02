'use client';
// FILE: admin/alerts/AlertsClient.tsx
// AI budget alerts and the weekly digest share one recipient list and one
// master switch, so they share one page.
//
// Mutate → refetch → toast, no optimistic UI. Thresholds are staged locally and
// saved explicitly: a number input that PATCHed on every keystroke would fire a
// write per digit, and "1" is a very different threshold from "1000000".

import { useCallback, useEffect, useState } from 'react';
import { Card, Switch, Button, useToast } from '@/components/ui';
import { fetchAlertSettings, patchAlertSettings, sendTestDigest } from '@/api/admin-alert-settings-api';
import type { AlertSettings } from '@/types/admin-alert-settings';
import { relativeTime } from '../parts/mission-format';

const CONTROL = {
  padding: '7px 10px', borderRadius: 8, fontSize: '0.85rem',
  border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--ink)',
} as const;

const LABEL = { fontSize: '0.82rem', color: 'var(--ink-muted)', display: 'block' } as const;

export default function AlertsClient() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState<AlertSettings | null>(null);
  const [error, setError] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [tokenThreshold, setTokenThreshold] = useState('');
  const [errorRate, setErrorRate] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const applySettings = useCallback((next: AlertSettings) => {
    setSettings(next);
    setTokenThreshold(String(next.dailyTokenThreshold));
    setErrorRate(String(next.errorRateThresholdPct));
  }, []);

  const load = useCallback(async () => {
    setError(false);
    try {
      applySettings(await fetchAlertSettings());
    } catch {
      setError(true);
    }
  }, [applySettings]);

  useEffect(() => { void load(); }, [load]);

  const save = useCallback(async (patch: Parameters<typeof patchAlertSettings>[0], message: string) => {
    setIsBusy(true);
    try {
      applySettings(await patchAlertSettings(patch));
      showToast('success', message);
    } catch {
      showToast('error', 'Could not save that change');
      await load();
    } finally {
      setIsBusy(false);
    }
  }, [applySettings, showToast, load]);

  const handleAddEmail = useCallback(() => {
    const email = newEmail.trim().toLowerCase();
    if (!email || !settings) return;
    if (settings.alertEmails.includes(email)) {
      showToast('error', 'That address is already on the list');
      return;
    }
    setNewEmail('');
    void save({ alertEmails: [...settings.alertEmails, email] }, `Added ${email}`);
  }, [newEmail, settings, save, showToast]);

  const handleTestDigest = useCallback(async () => {
    setIsBusy(true);
    try {
      const result = await sendTestDigest();
      if (result.sent) showToast('success', `Digest sent to ${result.recipients} recipient(s)`);
      else showToast('error', result.reason === 'no_recipients'
        ? 'Add at least one recipient first'
        : 'Could not send the digest');
    } catch {
      showToast('error', 'Could not send the digest');
    } finally {
      setIsBusy(false);
    }
  }, [showToast]);

  if (error && !settings) {
    return (
      <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.88rem', color: 'var(--ink-muted)' }}>Couldn&apos;t load alert settings.</span>
        <button type="button" onClick={() => void load()} style={{ ...CONTROL, cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }

  if (!settings) {
    return (
      <div data-testid="alerts-skeleton" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="anim-pulse" style={{ height: 120, borderRadius: 12, background: 'var(--paper-2)' }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)' }}>Alerts &amp; Digest</h1>
        <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
          AI budget alerts and the Monday digest. Every change is recorded in the audit log.
        </p>
      </div>

      <Card variant="raised">
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' }}>Email alerts</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', margin: '6px 0 16px', lineHeight: 1.55 }}>
          Master switch for both the budget alerts and the weekly digest. While this is
          off nothing is emailed, whatever the thresholds say.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Switch
            label="Alerts enabled"
            checked={settings.alertsEnabled}
            disabled={isBusy}
            onChange={(next) => void save({ alertsEnabled: next }, next ? 'Alerts enabled' : 'Alerts paused')}
          />
          <span style={{ fontSize: '0.85rem', fontWeight: 500, color: settings.alertsEnabled ? 'var(--success)' : 'var(--ink-muted)' }}>
            {settings.alertsEnabled ? 'Enabled' : 'Paused'}
          </span>
        </div>
        {settings.lastAlertSentAt && (
          <p style={{ margin: '12px 0 0', fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
            Last alert sent {relativeTime(settings.lastAlertSentAt)}. Alerts are rate-limited to one per 12 hours.
          </p>
        )}
      </Card>

      <Card variant="raised">
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' }}>Thresholds</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', margin: '6px 0 16px', lineHeight: 1.55 }}>
          An alert fires when either is crossed for the current IST day. The error rate is
          ignored below 20 calls, where a couple of failures is noise rather than a signal.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <label style={LABEL}>
            Daily token threshold
            <input
              type="number" min={0} value={tokenThreshold} disabled={isBusy}
              onChange={(event) => setTokenThreshold(event.target.value)}
              style={{ ...CONTROL, width: '100%', marginTop: 4 }}
            />
          </label>
          <label style={LABEL}>
            Error rate threshold (%)
            <input
              type="number" min={0} max={100} value={errorRate} disabled={isBusy}
              onChange={(event) => setErrorRate(event.target.value)}
              style={{ ...CONTROL, width: '100%', marginTop: 4 }}
            />
          </label>
        </div>
        <div style={{ marginTop: 12 }}>
          <Button
            size="sm" variant="secondary" loading={isBusy}
            onClick={() => void save({
              dailyTokenThreshold: Number(tokenThreshold),
              errorRateThresholdPct: Number(errorRate),
            }, 'Thresholds saved')}
          >
            Save thresholds
          </Button>
        </div>
      </Card>

      <Card variant="raised">
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' }}>Recipients</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', margin: '6px 0 16px', lineHeight: 1.55 }}>
          Who receives budget alerts and the Monday digest. With no recipients, both no-op.
        </p>

        {settings.alertEmails.length === 0 ? (
          <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: 'var(--ink-muted)' }}>No recipients yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {settings.alertEmails.map((email) => (
              <li key={email} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--ink)' }}>{email}</span>
                <Button
                  size="sm" variant="ghost" disabled={isBusy}
                  onClick={() => void save(
                    { alertEmails: settings.alertEmails.filter((entry) => entry !== email) },
                    `Removed ${email}`,
                  )}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            type="email" value={newEmail} disabled={isBusy}
            onChange={(event) => setNewEmail(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') handleAddEmail(); }}
            placeholder="ops@jobmesh.in"
            aria-label="Add recipient"
            style={{ ...CONTROL, flex: '1 1 220px' }}
          />
          <Button size="sm" variant="secondary" disabled={isBusy || !newEmail.trim()} onClick={handleAddEmail}>
            Add
          </Button>
        </div>
      </Card>

      <Card variant="raised">
        <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' }}>Weekly digest</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', margin: '6px 0 16px', lineHeight: 1.55 }}>
          Sent Monday at 08:00. The test below sends a <strong>real</strong> digest to every
          recipient above, right now — it is the only way to prove the whole path works.
        </p>
        <Button size="sm" variant="secondary" loading={isBusy} onClick={() => void handleTestDigest()}>
          Send test digest now
        </Button>
      </Card>
    </div>
  );
}
