'use client';
// FILE: src/components/seeker/profile/ProfileVisibilityToggles.tsx
// The per-section checkboxes on the public-profile settings card.
//
// ORDERED BY WHAT IS SAFE TO SHOW. The sections that are already public records
// come first and are on by default; email and phone sit last, off by default, and
// are labelled as contact details rather than as "sections" — because the decision
// a candidate is making about their phone number is a different decision from the
// one about their GitHub stats, and stacking them identically hides that.

import { Checkbox, Stack } from '../../ui';
import type { ProfileVisibilitySettings } from '../../../types/public-profile';

type ToggleKey = keyof Pick<
  ProfileVisibilitySettings,
  'showSkills' | 'showExperience' | 'showLeetCode' | 'showGitHub' | 'showResume' | 'showEmail' | 'showPhone'
>;

interface ToggleRow {
  key: ToggleKey;
  label: string;
  /** Set when the underlying data is missing — shown, but disabled and explained. */
  requires?: 'leetcode' | 'github' | 'resume';
}

const CONTENT_TOGGLES: ToggleRow[] = [
  { key: 'showSkills', label: 'Skills' },
  { key: 'showExperience', label: 'Work experience' },
  { key: 'showLeetCode', label: 'LeetCode stats', requires: 'leetcode' },
  { key: 'showGitHub', label: 'GitHub stats', requires: 'github' },
  { key: 'showResume', label: 'Resume (viewable as a PDF)', requires: 'resume' },
];

const CONTACT_TOGGLES: ToggleRow[] = [
  { key: 'showEmail', label: 'Email address' },
  { key: 'showPhone', label: 'Phone number' },
];

const MISSING_NOTE = {
  leetcode: 'Connect LeetCode above to share it.',
  github: 'Connect GitHub above to share it.',
  resume: 'Upload a resume to share it.',
};

export default function ProfileVisibilityToggles({ settings, available, onChange }: {
  settings: ProfileVisibilitySettings;
  available: { hasLeetCode: boolean; hasGitHub: boolean; hasResume: boolean };
  onChange: (patch: Partial<ProfileVisibilitySettings>) => void;
}) {
  const isAvailable = (requires?: ToggleRow['requires']) => {
    if (requires === 'leetcode') return available.hasLeetCode;
    if (requires === 'github') return available.hasGitHub;
    if (requires === 'resume') return available.hasResume;
    return true;
  };

  const renderRow = (row: ToggleRow) => {
    const enabled = isAvailable(row.requires);
    return (
      <Stack gap={2} key={row.key}>
        <Checkbox
          label={row.label}
          checked={settings[row.key]}
          disabled={!enabled}
          onChange={(checked) => onChange({ [row.key]: checked })}
        />
        {!enabled && row.requires && (
          <span style={{ fontSize: '0.75rem', color: 'var(--ink-faint)', paddingLeft: 26 }}>
            {MISSING_NOTE[row.requires]}
          </span>
        )}
      </Stack>
    );
  };

  return (
    <Stack gap={14}>
      <Stack gap={8}>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-faint)', margin: 0 }}>
          What to show
        </p>
        {CONTENT_TOGGLES.map(renderRow)}
      </Stack>

      <Stack gap={8}>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-faint)', margin: 0 }}>
          Contact details
        </p>
        {CONTACT_TOGGLES.map(renderRow)}
        <span style={{ fontSize: '0.75rem', color: 'var(--ink-faint)' }}>
          Off by default. With both off, visitors can still message you through a
          form — they just never see your address.
        </span>
      </Stack>
    </Stack>
  );
}
