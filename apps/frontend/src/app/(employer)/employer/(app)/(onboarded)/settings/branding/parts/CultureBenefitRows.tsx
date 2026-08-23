'use client';
// FILE: settings/branding/parts/CultureBenefitRows.tsx
// The benefits list inside the culture editor. One row per perk: emoji, title,
// description, plus reorder and remove.
//
// The icon field is a plain text input rather than an emoji picker. An employer
// types 🏥 with their own keyboard in less time than a picker takes to open, and a
// picker would be a large dependency for a 30-character optional field. Any short
// string works — the careers page sizes the disc, not its contents.

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Button, Input, Stack } from '@/components/ui';
import { COPY } from '@/theme/brand';
import {
  MAXIMUM_BENEFITS, MAXIMUM_BENEFIT_TITLE_LENGTH, MAXIMUM_BENEFIT_DESCRIPTION_LENGTH,
  type CultureBenefit,
} from '@/context/employer/employer-context-types';

const TEXT = COPY.employer.culture;

function IconButton({ label, disabled, onClick, children }: {
  label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      type="button" aria-label={label} title={label} disabled={disabled} onClick={onClick}
      style={{
        background: 'none', border: 'none', padding: 4, lineHeight: 0,
        color: 'var(--ink-faint)', display: 'inline-flex',
        opacity: disabled ? 0.35 : 1, cursor: disabled ? 'default' : 'pointer',
      }}
    >
      {children}
    </button>
  );
}

export default function CultureBenefitRows({ benefits, disabled, onChange }: {
  benefits: CultureBenefit[];
  disabled: boolean;
  onChange: (next: CultureBenefit[]) => void;
}) {
  const isFull = benefits.length >= MAXIMUM_BENEFITS;

  const update = (index: number, patch: Partial<CultureBenefit>) =>
    onChange(benefits.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= benefits.length) return;
    const next = [...benefits];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <Stack gap={10}>
      <div>
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--ink-muted)' }}>
          {TEXT.benefitsLabel}
        </span>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ink-faint)' }}>{TEXT.benefitsHint}</p>
      </div>

      {benefits.map((benefit, index) => (
        <div
          key={index}
          style={{
            border: '0.5px solid var(--border)', borderRadius: 8, padding: 10,
            background: 'var(--surface-raised)',
          }}
        >
          <Stack gap={8}>
            <Stack gap={8} dir="row" align="flex-start" wrap>
              {/* Narrow by design — this holds one emoji, and a full-width field
                  would invite a sentence. */}
              <div style={{ width: 72, flexShrink: 0 }}>
                <Input
                  label={TEXT.benefitIconLabel}
                  value={benefit.icon ?? ''}
                  maxLength={30}
                  disabled={disabled}
                  onChange={(e) => update(index, { icon: e.target.value || null })}
                />
              </div>
              <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                <Input
                  label={TEXT.benefitTitleLabel}
                  required
                  value={benefit.title}
                  placeholder={TEXT.benefitTitlePlaceholder}
                  maxLength={MAXIMUM_BENEFIT_TITLE_LENGTH}
                  disabled={disabled}
                  onChange={(e) => update(index, { title: e.target.value })}
                />
              </div>
              <Stack gap={0} dir="row" align="center">
                <IconButton label={TEXT.moveBenefitUp} disabled={disabled || index === 0} onClick={() => move(index, -1)}>
                  <ArrowUp size={14} aria-hidden="true" />
                </IconButton>
                <IconButton
                  label={TEXT.moveBenefitDown}
                  disabled={disabled || index === benefits.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown size={14} aria-hidden="true" />
                </IconButton>
                <IconButton
                  label={TEXT.removeBenefit}
                  disabled={disabled}
                  onClick={() => onChange(benefits.filter((_, i) => i !== index))}
                >
                  <Trash2 size={14} aria-hidden="true" />
                </IconButton>
              </Stack>
            </Stack>

            <Input
              label={TEXT.benefitDescriptionLabel}
              value={benefit.description ?? ''}
              placeholder={TEXT.benefitDescriptionPlaceholder}
              maxLength={MAXIMUM_BENEFIT_DESCRIPTION_LENGTH}
              disabled={disabled}
              onChange={(e) => update(index, { description: e.target.value || null })}
            />
          </Stack>
        </div>
      ))}

      <Stack gap={8} dir="row" align="center" wrap>
        <Button
          type="button" variant="secondary" size="sm" disabled={disabled || isFull}
          onClick={() => onChange([...benefits, { icon: null, title: '', description: null }])}
        >
          <Stack gap={6} dir="row" align="center">
            <Plus size={14} aria-hidden="true" />
            {TEXT.addBenefit}
          </Stack>
        </Button>
        {isFull && <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{TEXT.benefitLimit}</span>}
      </Stack>
    </Stack>
  );
}
