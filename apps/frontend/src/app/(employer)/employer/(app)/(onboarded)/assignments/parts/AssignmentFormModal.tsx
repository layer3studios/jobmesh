'use client';
// FILE: assignments/parts/AssignmentFormModal.tsx
// One component, three modes: create, edit, clone. They differ only in the initial
// values, the title, and which endpoint the submit hits — splitting them into three
// components would triple the surface where the validation and the markdown preview
// could drift apart.
//
// The preview tab reuses src/components/shared/Markdown.tsx, the 7a renderer. That
// file has no 'use client' directive and no server-only APIs, so it composes into a
// client tree unchanged. There is deliberately NO second renderer, no rehype-raw,
// and no markdown editor dependency: a textarea plus a preview tab is the whole
// feature, and the renderer's no-raw-HTML guarantee is the reason a '<script>' in a
// code fence is safe to accept.

import { useMemo, useState } from 'react';
import Markdown from '@/components/shared/Markdown';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Alert } from '@/components/ui/feedback';
import {
  createAssignment, updateAssignment, EmployerAssignmentsApiError,
} from '@/api/employer-assignments-api';
import { ALLOWED_FILE_TYPES } from '@/types/employer-assignments';
import type { EmployerAssignment, AssignmentCreateInput, AssignmentUsage } from '@/types/employer-assignments';
import {
  validateAssignmentForm, toAssignmentPayload, fieldForServerCode,
  PUBLIC_SUMMARY_MAX, ESTIMATED_HOURS_MIN, ESTIMATED_HOURS_MAX,
} from './assignment-form-helpers';
import type { AssignmentErrors } from './assignment-form-helpers';

export type FormMode = 'create' | 'edit' | 'clone';

const MODE_TITLE: Record<FormMode, string> = {
  create: 'New assignment',
  edit: 'Edit assignment',
  clone: 'Clone assignment',
};

const EMPTY: AssignmentCreateInput = {
  title: '', publicSummary: '', descriptionMarkdown: '',
  submissionInstructionsMarkdown: '', estimatedHours: 2, allowedFileTypes: [],
};

const HOUR_OPTIONS = Array.from(
  { length: ESTIMATED_HOURS_MAX - ESTIMATED_HOURS_MIN + 1 },
  (_, i) => {
    const value = ESTIMATED_HOURS_MIN + i;
    return { value: String(value), label: `${value} ${value === 1 ? 'hour' : 'hours'}` };
  },
);

const helperStyle: React.CSSProperties = { fontSize: '0.78rem', color: 'var(--ink-muted)', margin: '5px 0 0', lineHeight: 1.5 };

/** Seed the form from the mode. Clone copies everything and suffixes the title. */
function initialValues(mode: FormMode, source: EmployerAssignment | null): AssignmentCreateInput {
  if (!source) return EMPTY;
  return {
    title: mode === 'clone' ? `${source.title} (copy)` : source.title,
    publicSummary: source.publicSummary ?? '',
    descriptionMarkdown: source.descriptionMarkdown ?? '',
    submissionInstructionsMarkdown: source.submissionInstructionsMarkdown ?? '',
    estimatedHours: source.estimatedHours ?? EMPTY.estimatedHours,
    allowedFileTypes: [...(source.allowedFileTypes ?? [])],
  };
}

/** A textarea with a Write / Preview tab pair over the shared markdown renderer. */
function MarkdownField({
  label, value, error, rows, placeholder, onChange,
}: {
  label: string; value: string; error?: string; rows: number; placeholder?: string;
  onChange: (next: string) => void;
}) {
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '4px 10px', fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
    borderRadius: 6, border: '1px solid ' + (active ? 'var(--border-strong)' : 'transparent'),
    background: active ? 'var(--paper-2)' : 'transparent',
    color: active ? 'var(--ink)' : 'var(--ink-muted)',
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--ink-muted)' }}>{label}</span>
        <div role="tablist" aria-label={`${label} editor mode`} style={{ display: 'flex', gap: 4 }}>
          <button type="button" role="tab" aria-selected={tab === 'write'} style={tabStyle(tab === 'write')} onClick={() => setTab('write')}>Write</button>
          <button type="button" role="tab" aria-selected={tab === 'preview'} style={tabStyle(tab === 'preview')} onClick={() => setTab('preview')}>Preview</button>
        </div>
      </div>
      {tab === 'write' ? (
        <Textarea aria-label={label} rows={rows} value={value} error={error} placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)} />
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px', minHeight: 88 }}>
          {value.trim()
            ? <Markdown>{value}</Markdown>
            : <p style={{ ...helperStyle, margin: 0 }}>Nothing to preview yet.</p>}
        </div>
      )}
      {error && tab === 'preview' && <p role="alert" style={{ ...helperStyle, color: 'var(--danger)' }}>{error}</p>}
    </div>
  );
}

interface Props {
  mode: FormMode;
  /** The row being edited or cloned. null in create mode. */
  source: EmployerAssignment | null;
  onClose: () => void;
  onSaved: (assignment: EmployerAssignment) => void;
}

export default function AssignmentFormModal({ mode, source, onClose, onSaved }: Props) {
  const [values, setValues] = useState<AssignmentCreateInput>(() => initialValues(mode, source));
  const [errors, setErrors] = useState<AssignmentErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [blockingJobs, setBlockingJobs] = useState<AssignmentUsage[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const validation = useMemo(() => validateAssignmentForm(values), [values]);
  const set = <K extends keyof AssignmentCreateInput>(key: K, value: AssignmentCreateInput[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setFormError(null);
  };

  const toggleFileType = (type: string, checked: boolean) => {
    set('allowedFileTypes', checked
      ? [...values.allowedFileTypes, type]
      : values.allowedFileTypes.filter((t) => t !== type));
  };

  function handleError(err: unknown): void {
    if (!(err instanceof EmployerAssignmentsApiError)) {
      setFormError('Something went wrong. Please try again.');
      return;
    }
    if (err.status === 409) {
      // The task is attached to live postings. Name them and offer the clone.
      setBlockingJobs(err.jobs);
      setFormError(err.message);
      return;
    }
    if (err.status === 403) {
      // The UI gating should have prevented this from ever being clickable, so a 403
      // here means our role model and the backend's disagree. Surface it in the
      // console as the bug signal it is rather than only telling the user.
      console.error('[assignments] 403 on a control the UI offered — client role gating is out of sync with the backend.', err.code);
      setFormError('You don\'t have permission to do this.');
      return;
    }
    const field = fieldForServerCode(err.code);
    if (field) setErrors((e) => ({ ...e, [field]: { code: err.code as string, message: err.message } }));
    else setFormError(err.message || 'Something went wrong. Please try again.');
  }

  async function submit(): Promise<void> {
    const result = validateAssignmentForm(values);
    if (!result.valid) { setErrors(result.errors); return; }
    setErrors({});
    setFormError(null);
    setBlockingJobs([]);
    setIsSaving(true);
    try {
      const payload = toAssignmentPayload(values);
      // Clone mode POSTs a fresh assignment rather than hitting /clone: the employer
      // has just edited the copy in this form, and /clone would silently discard
      // those edits by copying the ORIGINAL server-side.
      const saved = mode === 'edit' && source
        ? await updateAssignment(source.id, payload)
        : await createAssignment(payload);
      onSaved(saved);
    } catch (err) {
      handleError(err);
    } finally {
      setIsSaving(false);
    }
  }

  const summaryLength = values.publicSummary.length;
  const hoursWarning = validation.warnings.estimatedHours;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={MODE_TITLE[mode]}
      size="lg"
      footer={(
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          {/* Never disabled on the hours warning — that is advice, not a rule. */}
          <Button onClick={submit} loading={isSaving}>
            {mode === 'edit' ? 'Save changes' : 'Create assignment'}
          </Button>
        </>
      )}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {formError && (
          <Alert type="error">
            <p style={{ margin: 0 }}>{formError}</p>
            {blockingJobs.length > 0 && (
              <p style={{ margin: '4px 0 0' }}>
                {blockingJobs.map((job) => job.title ?? 'Untitled posting').join(', ')}
              </p>
            )}
          </Alert>
        )}

        <Input
          label="Title" required value={values.title} error={errors.title?.message}
          placeholder="Frontend take-home: dashboard widget"
          onChange={(e) => set('title', e.target.value)}
        />

        <div>
          <Textarea
            label="Public summary" required rows={3} value={values.publicSummary}
            error={errors.publicSummary?.message}
            maxLength={PUBLIC_SUMMARY_MAX}
            placeholder="One or two sentences on what the task involves."
            onChange={(e) => set('publicSummary', e.target.value.slice(0, PUBLIC_SUMMARY_MAX))}
          />
          <p style={helperStyle}>
            {`Shown on the job page before someone applies. ${summaryLength} / ${PUBLIC_SUMMARY_MAX}`}
          </p>
        </div>

        <div>
          <MarkdownField
            label="Description" rows={10} value={values.descriptionMarkdown}
            error={errors.descriptionMarkdown?.message}
            placeholder={'## The task\n\nBuild a small dashboard widget that…'}
            onChange={(next) => set('descriptionMarkdown', next)}
          />
          {/* An employer who believes the task is confidential writes a worse task —
              vaguer, or padded with material they would not publish. Chunk 6 exposes
              the full text on a public endpoint by design, so say so here. */}
          <p style={helperStyle}>
            Candidates can read this before applying. Assume it will be shared publicly.
          </p>
        </div>

        <MarkdownField
          label="Submission instructions (optional)" rows={5}
          value={values.submissionInstructionsMarkdown}
          error={errors.submissionInstructionsMarkdown?.message}
          placeholder="How should they hand it in? A repo link, a deployed URL…"
          onChange={(next) => set('submissionInstructionsMarkdown', next)}
        />

        <div>
          <Select
            label="Estimated hours"
            value={String(values.estimatedHours)}
            options={HOUR_OPTIONS}
            error={errors.estimatedHours?.message}
            onChange={(e) => set('estimatedHours', Number(e.target.value))}
          />
          {hoursWarning && (
            <p style={{ ...helperStyle, color: 'var(--warning)' }}>{hoursWarning}</p>
          )}
        </div>

        <div>
          <p style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--ink-muted)', marginBottom: 8 }}>
            Accepted file types
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {ALLOWED_FILE_TYPES.map((type) => (
              <Checkbox
                key={type}
                label={type.toUpperCase()}
                checked={values.allowedFileTypes.includes(type)}
                onChange={(checked) => toggleFileType(type, checked)}
              />
            ))}
          </div>
          {/* Zero checked is a real configuration, not an unfinished form. */}
          {values.allowedFileTypes.length === 0 && (
            <p style={helperStyle}>Link-only submission — candidates submit a URL.</p>
          )}
          {errors.allowedFileTypes && (
            <p role="alert" style={{ ...helperStyle, color: 'var(--danger)' }}>{errors.allowedFileTypes.message}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
