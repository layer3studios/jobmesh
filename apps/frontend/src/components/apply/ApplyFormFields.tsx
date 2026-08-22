'use client';
// FILE: src/components/apply/ApplyFormFields.tsx
// The input block for the apply form. Single-column, mobile-first (C10). Owns no
// submit logic — the parent (ApplyFormClient) holds state and passes handlers.
// Resume uses the native file-input pattern (C7); the honeypot is visually
// offscreen but present in the DOM (R4).
//
// GROUPING. The fields are wrapped in real <fieldset>/<legend> pairs, restyled to
// look like small section labels. Deliberately not <div> + <p>: a fieldset is what
// makes a screen reader announce "Your details" when focus enters the group, so
// the grouping is heard as well as seen. Nothing here is reordered, renamed or
// re-id'd — the fieldsets are wrappers around the existing fields in their
// existing order, so tab order and FormData are untouched.

import { useRef } from 'react';
import { Input, Textarea, Checkbox, Button, Stack } from '@/components/ui';
import type { ApplyFormData } from '@/types/public-apply';
import type { ApplyErrors } from './apply-form-helpers';
import { SOURCE_OPTIONS } from './apply-source';

interface Props {
  data: ApplyFormData;
  errors: ApplyErrors;
  companyName: string;
  set: <K extends keyof ApplyFormData>(field: K, value: ApplyFormData[K]) => void;
  onBlur: (field: keyof ApplyFormData) => void;
  // First-focus-per-field analytics hook (dedup handled by the parent).
  onFieldFocus: (field: string) => void;
  /**
   * The assignment submission block, on a take-home posting only. It arrives as a
   * slot so it can sit ABOVE consent — the highest-value part of the form should
   * not be below a legal checkbox — without this component knowing anything about
   * assignments. On a plain posting the caller passes nothing and the DOM here is
   * identical to before.
   */
  submissionSlot?: React.ReactNode;
  /** False when ?source= already answered it — then the field is not rendered. */
  showSourceField?: boolean;
}

export default function ApplyFormFields({
  data, errors, companyName, set, onBlur, onFieldFocus,
  submissionSlot = null, showSourceField = true,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="apply-group-stack">
      <fieldset className="apply-fieldset">
        <legend className="apply-legend">Your details</legend>
        <div className="apply-field-stack">
          <Stack gap={12} dir="row" wrap>
            {/* autoComplete lets the browser fill the whole block in one gesture,
                which is the single biggest time saving available on this form. */}
            <div style={{ flex: '1 1 160px' }} onFocus={() => onFieldFocus('name')}>
              <Input label="First name" required autoComplete="given-name" value={data.firstName} error={errors.firstName}
                onChange={(e) => set('firstName', e.target.value)} onBlur={() => onBlur('firstName')} />
            </div>
            <div style={{ flex: '1 1 160px' }} onFocus={() => onFieldFocus('name')}>
              <Input label="Last name" required autoComplete="family-name" value={data.lastName} error={errors.lastName}
                onChange={(e) => set('lastName', e.target.value)} onBlur={() => onBlur('lastName')} />
            </div>
          </Stack>

          <div onFocus={() => onFieldFocus('email')}>
            <Input label="Email" required type="email" inputMode="email" autoComplete="email" value={data.email} error={errors.email}
              onChange={(e) => set('email', e.target.value)} onBlur={() => onBlur('email')} />
          </div>

          <div onFocus={() => onFieldFocus('phone')}>
            <Input label="Phone" type="text" inputMode="tel" autoComplete="tel" value={data.phone} error={errors.phone}
              onChange={(e) => set('phone', e.target.value)} onBlur={() => onBlur('phone')} />
          </div>
        </div>
      </fieldset>

      <fieldset className="apply-fieldset">
        <legend className="apply-legend">Resume</legend>
        <div className="apply-field-stack">
          <div onFocus={() => onFieldFocus('resume')}>
            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--ink-muted)', marginBottom: 6 }}>Resume (PDF) *</p>
            <Stack gap={8} dir="row" align="center" wrap>
              <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
                {data.resume ? 'Change file' : 'Choose PDF'}
              </Button>
              {data.resume && <span style={{ fontSize: '0.85rem', color: 'var(--ink)' }}>{data.resume.name}</span>}
            </Stack>
            <input ref={fileRef} type="file" accept="application/pdf,.pdf" hidden
              onChange={(e) => { set('resume', e.target.files?.[0] ?? null); onBlur('resume'); }} />
            {errors.resume && <p role="alert" style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: 5 }}>{errors.resume}</p>}
          </div>
        </div>
      </fieldset>

      {/* The cover note belongs to no specced group, and moving it into one would
          change tab order — which is not allowed to change. It therefore stays
          exactly where it has always been, between the resume and the submission,
          ungrouped. */}
      <div onFocus={() => onFieldFocus('coverNote')}>
        <Textarea label="Cover note" rows={4} value={data.coverNote}
          placeholder="Why are you interested in this role?" onChange={(e) => set('coverNote', e.target.value)} />
      </div>

      {/* Hidden entirely when the URL already answered it — asking someone where
          they came from when we just watched them arrive is noise. */}
      {showSourceField && (
        <div onFocus={() => onFieldFocus('source')}>
          <label
            htmlFor="apply-source"
            style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'var(--ink-muted)', marginBottom: 6 }}
          >
            How did you hear about us?
          </label>
          <select
            id="apply-source"
            value={data.source}
            onChange={(e) => set('source', e.target.value)}
            style={{
              width: '100%', fontSize: '0.875rem', padding: '8px 10px', borderRadius: 8,
              border: '0.5px solid var(--border)', background: 'var(--surface-raised)', color: 'var(--ink)',
            }}
          >
            <option value="">Prefer not to say</option>
            {SOURCE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>
      )}

      {submissionSlot}

      <fieldset className="apply-fieldset">
        <legend className="apply-legend">Consent</legend>
        <div className="apply-field-stack">
          <div onFocus={() => onFieldFocus('consent')}>
            <Checkbox checked={data.consent_dpdp} onChange={(v) => set('consent_dpdp', v)}
              label={`I agree to JobMesh and ${companyName} processing my data for recruitment purposes.`} />
            {errors.consent_dpdp && <p role="alert" style={{ color: 'var(--danger)', fontSize: '0.78rem', marginTop: 5 }}>{errors.consent_dpdp}</p>}
            <a href="/legal/privacy" target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--link)', display: 'inline-block', marginTop: 4 }}>
              Read the Privacy Notice
            </a>
          </div>

          <Checkbox checked={data.consent_futureOpportunities} onChange={(v) => set('consent_futureOpportunities', v)}
            label={`I'm open to being contacted about future roles at ${companyName}.`} />
        </div>
      </fieldset>

      {/* Honeypot — offscreen (not display:none) so bots fill it but humans/AT skip it (R4). */}
      <input
        type="text" name="website_url" tabIndex={-1} autoComplete="off" aria-hidden
        value={data.honeypot ?? ''} onChange={(e) => set('honeypot', e.target.value)}
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
      />
    </div>
  );
}
