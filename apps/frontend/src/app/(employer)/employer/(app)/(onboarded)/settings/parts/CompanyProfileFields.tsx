'use client';
// FILE: settings/parts/CompanyProfileFields.tsx
// The editable half of Company settings: name, tagline, about and social links.
// Presentational — the parent owns state, saving and the dirty check, so this file
// stays a layout concern and CompanySettingsClient stays under the line ceiling.

import { Input, Textarea } from '@/components/ui';

export interface SocialLinkValues {
  linkedin: string;
  twitter: string;
  github: string;
}

const TAGLINE_MAX = 120;
const ABOUT_MAX = 500;

const SOCIAL_FIELDS: { key: keyof SocialLinkValues; label: string; placeholder: string }[] = [
  { key: 'linkedin', label: 'LinkedIn URL', placeholder: 'https://linkedin.com/company/acme' },
  { key: 'twitter', label: 'X (Twitter) URL', placeholder: 'https://x.com/acme' },
  { key: 'github', label: 'GitHub URL', placeholder: 'https://github.com/acme' },
];

const COUNTER = { margin: '4px 0 0', fontSize: 12, color: 'var(--ink-faint)', textAlign: 'right' } as const;

export default function CompanyProfileFields({
  name, tagline, about, social, socialErrors,
  onNameChange, onTaglineChange, onAboutChange, onSocialChange, onSocialBlur,
}: {
  name: string;
  tagline: string;
  about: string;
  social: SocialLinkValues;
  /** Per-network message, or null. Shown inline under the offending input. */
  socialErrors: Partial<Record<keyof SocialLinkValues, string | null>>;
  onNameChange: (value: string) => void;
  onTaglineChange: (value: string) => void;
  onAboutChange: (value: string) => void;
  onSocialChange: (key: keyof SocialLinkValues, value: string) => void;
  onSocialBlur: (key: keyof SocialLinkValues) => void;
}) {
  return (
    <>
      <Input label="Company name" value={name} maxLength={120} onChange={(e) => onNameChange(e.target.value)} />

      <div style={{ marginTop: 12 }}>
        <Input
          label="Tagline"
          placeholder="One line about your company"
          value={tagline}
          maxLength={TAGLINE_MAX}
          onChange={(e) => onTaglineChange(e.target.value)}
        />
        <p style={COUNTER}>{tagline.length}/{TAGLINE_MAX}</p>
      </div>

      <div style={{ marginTop: 12 }}>
        <Textarea
          label="About"
          placeholder="What your company does, and what it's like to work there."
          rows={4}
          value={about}
          maxLength={ABOUT_MAX}
          onChange={(e) => onAboutChange(e.target.value)}
        />
        <p style={COUNTER}>{about.length}/{ABOUT_MAX}</p>
      </div>

      <div style={{ marginTop: 16 }}>
        <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>Social links</p>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--ink-faint)' }}>
          Shown on your careers page. Leave blank to hide.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {SOCIAL_FIELDS.map((field) => (
            <Input
              key={field.key}
              label={field.label}
              inputMode="url"
              placeholder={field.placeholder}
              value={social[field.key]}
              error={socialErrors[field.key] ?? undefined}
              onChange={(e) => onSocialChange(field.key, e.target.value)}
              onBlur={() => onSocialBlur(field.key)}
            />
          ))}
        </div>
      </div>
    </>
  );
}
