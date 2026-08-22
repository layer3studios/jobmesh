'use client';
// FILE: settings/email/parts/RejectionTemplateCard.tsx
// One editable rejection template. Owns only its own draft text and Write/Preview
// tab; saving and resetting are the parent's, so all three cards share one PATCH
// path and one error surface.

import { useState } from 'react';
import { Button, Textarea } from '@/components/ui';
import { renderTemplate, PREVIEW_SAMPLE } from '../rejection-template-defaults';
import type { RejectionStage } from '../rejection-template-defaults';

const MAX_LENGTH = 1000;
const TAB = {
  fontSize: 12, padding: '3px 10px', borderRadius: 6, border: 'none',
  cursor: 'pointer', background: 'transparent', color: 'var(--ink-muted)',
} as const;
const TAB_ACTIVE = { ...TAB, background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 500 } as const;

export default function RejectionTemplateCard({
  stage, value, companyName, canEdit, isSaving, isDirty, onChange, onSave, onReset,
}: {
  stage: RejectionStage;
  /** The employer's custom body, or '' when they are using the default. */
  value: string;
  companyName: string;
  canEdit: boolean;
  isSaving: boolean;
  isDirty: boolean;
  onChange: (next: string) => void;
  onSave: () => void;
  onReset: () => void;
}) {
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  // An empty box means "use the default", so the preview shows the default rather
  // than a blank card — that is genuinely what a candidate would receive.
  const effectiveBody = value.trim() === '' ? stage.defaultBody : value;
  const preview = renderTemplate(effectiveBody, { ...PREVIEW_SAMPLE, companyName });

  return (
    <div style={{
      background: 'var(--surface-raised)', border: '0.5px solid var(--border)',
      borderRadius: 12, padding: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{stage.title}</p>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ink-muted)' }}>{stage.subtitle}</p>
        </div>
        <div style={{ display: 'inline-flex', gap: 2, flexShrink: 0 }}>
          <button type="button" style={tab === 'write' ? TAB_ACTIVE : TAB} onClick={() => setTab('write')}>
            Write
          </button>
          <button type="button" style={tab === 'preview' ? TAB_ACTIVE : TAB} onClick={() => setTab('preview')}>
            Preview
          </button>
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        {tab === 'preview' ? (
          <div style={{
            whiteSpace: 'pre-wrap', fontSize: 13, lineHeight: 1.6, color: 'var(--ink-2)',
            background: 'var(--surface-sunken)', border: '0.5px solid var(--border)',
            borderRadius: 8, padding: 12, minHeight: 120,
          }}>
            {preview}
          </div>
        ) : (
          <Textarea
            aria-label={`${stage.title} template`}
            rows={8}
            maxLength={MAX_LENGTH}
            value={value}
            // The default is the PLACEHOLDER, not the value: that way an untouched
            // card saves nothing, and clearing the box reverts to the default
            // instead of sending an empty email.
            placeholder={stage.defaultBody}
            disabled={!canEdit}
            onChange={(event) => onChange(event.target.value)}
          />
        )}
      </div>

      <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--ink-faint)' }}>
        Variables: {'{firstName}'}, {'{jobTitle}'}, {'{companyName}'} — replaced when sending.
        {value.trim() === '' && ' Leave empty to use the default above.'}
      </p>

      {canEdit && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
          <Button size="sm" disabled={!isDirty || isSaving} loading={isSaving} onClick={onSave}>
            Save
          </Button>
          <button
            type="button"
            onClick={onReset}
            disabled={isSaving || value.trim() === ''}
            style={{
              background: 'none', border: 'none', padding: 0,
              cursor: value.trim() === '' ? 'default' : 'pointer',
              fontSize: 12, color: value.trim() === '' ? 'var(--ink-faint)' : 'var(--link)',
            }}
          >
            Reset to default
          </button>
        </div>
      )}
    </div>
  );
}
