'use client';
// FILE: settings/personal/ProfileFields.tsx
// Read-only identity, job title, and timezone.
//
// THE LIVE CLOCK IS THE POINT OF THE TIMEZONE FIELD. "Asia/Kolkata" tells you almost
// nothing about whether you picked the right zone; "3:45 PM IST" tells you
// immediately. It ticks once a minute, and it reads from the DRAFT value rather than
// the saved one, so the preview answers "what would this do" before you commit.

import { useEffect, useState } from 'react';
import { Input, Select } from '@/components/ui';
import { COPY } from '@/theme/brand';
import { buildTimezoneGroups, formatZoneLabel, formatCurrentTimeIn } from './timezone-helpers';

const C = COPY.employer.personal;
const MAXIMUM_JOB_TITLE_LENGTH = 60;
const CLOCK_TICK_MS = 30_000;

const READ_ONLY_ROW = {
  display: 'flex', justifyContent: 'space-between', gap: 12,
  padding: '7px 0', fontSize: 13, borderBottom: '0.5px solid var(--border)',
} as const;

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={READ_ONLY_ROW}>
      <span style={{ color: 'var(--ink-muted)' }}>{label}</span>
      <span style={{ color: 'var(--ink)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {value}
      </span>
    </div>
  );
}

export default function ProfileFields({
  name, email, jobTitle, timezone, disabled, onJobTitleChange, onTimezoneChange,
}: {
  name: string;
  email: string;
  jobTitle: string;
  timezone: string;
  disabled: boolean;
  onJobTitleChange: (next: string) => void;
  onTimezoneChange: (next: string) => void;
}) {
  const [now, setNow] = useState<Date | null>(null);

  // Null until mounted: rendering a clock during SSR guarantees a hydration
  // mismatch, because the server's "now" is never the browser's.
  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), CLOCK_TICK_MS);
    return () => window.clearInterval(timer);
  }, []);

  const groups = buildTimezoneGroups(timezone);
  const localTime = now ? formatCurrentTimeIn(timezone, now) : null;

  return (
    <>
      <section>
        <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{C.identity}</p>
        <ReadOnlyRow label={C.nameLabel} value={name} />
        <ReadOnlyRow label={C.emailLabel} value={email} />
        <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--ink-faint)' }}>{C.identityHint}</p>
      </section>

      <Input
        label={C.jobTitleLabel}
        hint={C.jobTitleHint}
        placeholder={C.jobTitlePlaceholder}
        value={jobTitle}
        maxLength={MAXIMUM_JOB_TITLE_LENGTH}
        disabled={disabled}
        onChange={(event) => onJobTitleChange(event.target.value)}
      />

      <div>
        <Select
          label={C.timezoneLabel}
          hint={C.timezoneHint}
          value={timezone}
          disabled={disabled}
          onChange={(event) => onTimezoneChange(event.target.value)}
        >
          {groups.map((group) => (
            <optgroup key={group.label} label={group.label}>
              {group.zones.map((zone) => (
                <option key={zone} value={zone}>{formatZoneLabel(zone)}</option>
              ))}
            </optgroup>
          ))}
        </Select>
        {localTime && (
          // aria-live: the value changes as the select changes, and a sighted user
          // sees that instantly while a screen-reader user would otherwise not.
          <p aria-live="polite" style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--ink-muted)' }}>
            {C.currentTime.replace('{time}', localTime)}
          </p>
        )}
      </div>
    </>
  );
}
