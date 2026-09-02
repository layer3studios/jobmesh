'use client';
// FILE: admin/flags/FlagsClient.tsx
// Runtime kill switches. Mutate → refetch → toast, no optimistic UI: the
// server's post-write state is the only honest answer, and a flag that looks
// off but is still on would be a dangerous thing to believe during an incident.
//
// Switching a flag OFF confirms first (EmployerAccess's pattern); switching ON
// is immediate — restoring the product should never need a second click.

import { useCallback, useEffect, useState } from 'react';
import { Card, Switch, Button, Modal, useToast } from '@/components/ui';
import { fetchFeatureFlags, setFeatureFlag } from '@/api/admin-feature-flags-api';
import type { FeatureFlagMap, FeatureFlagName } from '@/types/admin-feature-flags';
import { FLAG_COPY, FLAG_ORDER } from './parts/flag-copy';

function Skeletons() {
  return (
    <div data-testid="flags-skeleton" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="anim-pulse" style={{ height: 132, borderRadius: 12, background: 'var(--paper-2)' }} />
      ))}
    </div>
  );
}

export default function FlagsClient() {
  const { showToast } = useToast();
  const [flags, setFlags] = useState<FeatureFlagMap | null>(null);
  const [error, setError] = useState(false);
  const [busyFlag, setBusyFlag] = useState<FeatureFlagName | null>(null);
  const [pendingOff, setPendingOff] = useState<FeatureFlagName | null>(null);

  const load = useCallback(async () => {
    setError(false);
    try {
      setFlags((await fetchFeatureFlags()).flags);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const apply = useCallback(async (name: FeatureFlagName, value: boolean) => {
    setBusyFlag(name);
    try {
      // The PATCH response carries the full post-write state, so this IS the
      // refetch — no second round trip needed to be sure of what landed.
      const payload = await setFeatureFlag(name, value);
      setFlags(payload.flags);
      showToast('success', `${FLAG_COPY[name].title} ${value ? 'enabled' : 'paused'}`);
    } catch {
      showToast('error', `Could not update ${FLAG_COPY[name].title}`);
      await load();
    } finally {
      setBusyFlag(null);
      setPendingOff(null);
    }
  }, [showToast, load]);

  const handleToggle = useCallback((name: FeatureFlagName, next: boolean) => {
    // Turning something off is the destructive direction; confirm it.
    if (!next) setPendingOff(name);
    else void apply(name, true);
  }, [apply]);

  const pendingCopy = pendingOff ? FLAG_COPY[pendingOff] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)' }}>Feature Flags</h1>
        <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--ink-muted)' }}>
          Runtime switches. Every change is recorded in the audit log.
        </p>
      </div>

      {error && !flags && (
        <div role="alert" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.88rem', color: 'var(--ink-muted)' }}>Couldn&apos;t load the flags.</span>
          <button
            type="button" onClick={() => void load()}
            style={{
              padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem',
              border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--ink)',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {!flags && !error && <Skeletons />}

      {flags && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {FLAG_ORDER.map((name) => {
            const copy = FLAG_COPY[name];
            const isOn = flags[name];
            return (
              <Card key={name} variant="raised">
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--ink)' }}>{copy.title}</h2>
                  {!isOn && (
                    <span style={{
                      padding: '2px 8px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600,
                      color: 'var(--danger)', border: '1px solid var(--danger)',
                    }}>
                      Paused
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', margin: '6px 0 4px', lineHeight: 1.55 }}>
                  {copy.description}
                </p>
                <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', margin: '0 0 16px', lineHeight: 1.55 }}>
                  <strong style={{ color: 'var(--ink-2)' }}>When off:</strong> {copy.whenOff}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <Switch
                    label={copy.title}
                    checked={isOn}
                    disabled={busyFlag !== null}
                    onChange={(next) => handleToggle(name, next)}
                  />
                  <span style={{
                    fontSize: '0.85rem', fontWeight: 500,
                    color: isOn ? 'var(--success)' : 'var(--danger)',
                  }}>
                    {isOn ? 'Enabled' : 'Paused'}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={pendingOff !== null}
        onClose={() => setPendingOff(null)}
        title={pendingCopy?.confirmTitle ?? 'Pause this feature?'}
        footer={(
          <>
            <Button variant="ghost" onClick={() => setPendingOff(null)}>Cancel</Button>
            <Button
              variant="danger"
              disabled={busyFlag !== null}
              onClick={() => { if (pendingOff) void apply(pendingOff, false); }}
            >
              Pause it
            </Button>
          </>
        )}
      >
        {pendingCopy?.whenOff}
      </Modal>
    </div>
  );
}
