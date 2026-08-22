'use client';
// FILE: src/components/apply/AssignmentSection.tsx
// The submission INPUTS for a take-home posting, rendered inside the form card
// between the resume field and the consent checkboxes.
//
// Deliberately holds no copy of the task itself. The description and submission
// instructions render in the JD column (AssignmentPreview), which on desktop is the
// scrolling left column beside this pinned form — the candidate reads the task and
// fills the inputs side by side. Duplicating the description here would push the
// actual fields below the fold on the surface where they matter most.
//
// ui/FileUpload is intentionally NOT reused: it owns a single File in its own state
// and has no concept of an upload that is in flight, failed, or retryable per row.
// This dropzone is a thin shell over useAssignmentFiles, which owns all of that.

import { useMemo, useRef } from 'react';
import { Input, Textarea, Button, Stack } from '@/components/ui';
import {
  MAX_NOTES_LENGTH, MAX_SUBMISSION_LINKS, MAX_SUBMISSION_FILES, MAX_FILE_BYTES,
  isPrivateByDefaultHost, validateGithubProfile, validateLinkedinProfile,
} from './assignment-validation';
import AssignmentBadge from './AssignmentBadge';
import type { UseAssignmentFiles } from './useAssignmentFiles';

const hintStyle: React.CSSProperties = { fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: 5, lineHeight: 1.5 };
const errorStyle: React.CSSProperties = { fontSize: '0.78rem', color: 'var(--danger)', marginTop: 5 };
const legendStyle: React.CSSProperties = { fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)' };

function formatSize(bytes: number | null): string {
  if (bytes == null) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  /** The assignment's title, shown as this section's heading. Optional so the
   *  component stays renderable from a bare harness. */
  title?: string;
  /** Drives the inline hours badge. Optional for the same reason. */
  estimatedHours?: number;
  allowedFileTypes: string[];
  links: string[];
  linkErrors: Array<string | null>;
  github: string;
  linkedin: string;
  notes: string;
  uploads: UseAssignmentFiles;
  disabled: boolean;
  onLinkChange: (index: number, value: string) => void;
  onLinkBlur: (index: number) => void;
  onAddLink: () => void;
  onRemoveLink: (index: number) => void;
  onGithubChange: (value: string) => void;
  onLinkedinChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onFieldBlur: () => void;
}

export default function AssignmentSection({
  title, estimatedHours, allowedFileTypes, links, linkErrors, github, linkedin, notes, uploads, disabled,
  onLinkChange, onLinkBlur, onAddLink, onRemoveLink,
  onGithubChange, onLinkedinChange, onNotesChange, onFieldBlur,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shown once for the whole list, not per row: repeating it under five links would
  // read as five separate problems.
  const hasPrivateByDefaultLink = useMemo(
    () => links.some((link) => isPrivateByDefaultHost(link)),
    [links],
  );

  const githubCheck = validateGithubProfile(github);
  const linkedinError = validateLinkedinProfile(linkedin);

  // An employer with no accepted file types configured a LINK-ONLY submission.
  // Rendering an inert dropzone there would invite an upload we'd have to refuse.
  const acceptsFiles = allowedFileTypes.length > 0;
  const acceptAttribute = allowedFileTypes.map((type) => `.${type.toLowerCase()}`).join(',');

  return (
    // A real <fieldset>, so "Your submission" is announced when focus enters the
    // group rather than merely drawn above it. The card treatment is what lifts
    // this out of the run of ordinary fields — on a take-home posting it is the
    // part of the form the employer actually reviews.
    <fieldset className="apply-fieldset apply-submission-card">
      <legend className="apply-legend">Your submission</legend>
      <Stack gap={20}>
        <div>
          {/* The heading carries the TASK's title, not a generic label — the
              candidate is submitting *this* piece of work, and repeating its name
              here closes the gap between the brief in the other column and the
              inputs in this one. No deadline is shown: there is no deadline field
              on an assignment, and implying one would be a fiction. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {title && <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink)' }}>{title}</h3>}
            {estimatedHours != null && (
              <AssignmentBadge estimatedHours={estimatedHours} size="sm" />
            )}
          </div>
          <p style={hintStyle}>
            Add at least one link or file. This is what the employer reviews.
          </p>
        </div>

      {/* ── Submission links ───────────────────────────────────────────────── */}
      <div>
        <p style={legendStyle}>Submission link(s)</p>
        <Stack gap={8}>
          {links.map((link, index) => (
            <div key={index}>
              <Stack gap={8} dir="row" align="center">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Input
                    aria-label={`Submission link ${index + 1}`}
                    placeholder="https://github.com/you/take-home"
                    value={link}
                    disabled={disabled}
                    error={linkErrors[index] ?? undefined}
                    onChange={(e) => onLinkChange(index, e.target.value)}
                    onBlur={() => { onLinkBlur(index); onFieldBlur(); }}
                  />
                </div>
                {links.length > 1 && (
                  <Button
                    type="button" variant="ghost" size="sm" disabled={disabled}
                    aria-label={`Remove link ${index + 1}`}
                    onClick={() => onRemoveLink(index)}
                  >
                    Remove
                  </Button>
                )}
              </Stack>
              {index === 0 && (
                <p style={hintStyle}>Your repo, live demo, or wherever your work lives.</p>
              )}
            </div>
          ))}
        </Stack>

        {links.length < MAX_SUBMISSION_LINKS && (
          <div style={{ marginTop: 8 }}>
            <Button type="button" variant="secondary" size="sm" disabled={disabled} onClick={onAddLink}>
              + Add another link
            </Button>
          </div>
        )}

        {/* Persistent, not dismissible: a private link is the single most common
            reason a submission cannot be reviewed, and the candidate never finds
            out — the employer just sees a 404 and moves on. */}
        {hasPrivateByDefaultLink && (
          <p style={{ ...hintStyle, color: 'var(--warning)' }}>
            Check this opens in a private browser window — private links are the most
            common reason submissions can&apos;t be reviewed.
          </p>
        )}
      </div>

      {/* ── Files ──────────────────────────────────────────────────────────── */}
      {acceptsFiles && (
        <div>
          <p style={legendStyle}>Files</p>
          {/* A real <input type="file"> sits under the dropzone rather than beside
              it: drag-and-drop is unusable by keyboard and invisible to a screen
              reader, so the input is the actual control and the box is chrome. */}
          <div
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-label="Add submission files"
            onClick={() => { if (!disabled) fileInputRef.current?.click(); }}
            onKeyDown={(e) => {
              if (disabled) return;
              if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); }
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (!disabled) uploads.addFiles(e.dataTransfer.files);
            }}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
              padding: 18, borderRadius: 12, textAlign: 'center',
              border: '1.5px dashed var(--border-strong)',
              background: 'var(--surface)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
            }}
          >
            <span style={{ fontSize: '0.875rem', color: 'var(--ink)', fontWeight: 500 }}>
              Drag &amp; drop, or choose files
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--ink-faint)' }}>
              {allowedFileTypes.map((type) => type.toUpperCase()).join(', ')}
              {` · max ${Math.round(MAX_FILE_BYTES / (1024 * 1024))}MB · up to ${MAX_SUBMISSION_FILES} files`}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptAttribute}
              aria-label="Submission files"
              disabled={disabled}
              style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
              onChange={(e) => {
                if (e.target.files) uploads.addFiles(e.target.files);
                // Reset so picking the same file twice still fires onChange.
                e.target.value = '';
              }}
            />
          </div>

          {uploads.files.length > 0 && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {uploads.files.map((row) => (
                <div
                  key={row.localId}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                    padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)',
                  }}
                >
                  <span style={{ fontSize: '0.85rem', color: 'var(--ink)', flex: '1 1 140px', minWidth: 0 }}>
                    {row.originalName}
                  </span>
                  {row.sizeBytes != null && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--ink-faint)' }}>{formatSize(row.sizeBytes)}</span>
                  )}
                  <span
                    role="status"
                    style={{
                      fontSize: '0.75rem', fontWeight: 500,
                      color: row.status === 'error' ? 'var(--danger)'
                        : row.status === 'done' ? 'var(--success)' : 'var(--ink-muted)',
                    }}
                  >
                    {row.status === 'uploading' ? 'Uploading…' : row.status === 'done' ? 'Uploaded' : 'Failed'}
                  </span>
                  {/* Retry is offered only for a row we still hold bytes for. */}
                  {row.status === 'error' && row.file && (
                    <Button
                      type="button" variant="secondary" size="sm" disabled={disabled}
                      aria-label={`Retry upload of ${row.originalName}`}
                      onClick={() => uploads.retry(row.localId)}
                    >
                      Retry
                    </Button>
                  )}
                  <Button
                    type="button" variant="ghost" size="sm" disabled={disabled}
                    aria-label={`Remove ${row.originalName}`}
                    onClick={() => uploads.remove(row.localId)}
                  >
                    Remove
                  </Button>
                  {row.error && <p style={{ ...errorStyle, flexBasis: '100%' }}>{row.error}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── About you ──────────────────────────────────────────────────────── */}
      <div>
        <p style={legendStyle}>About you (optional)</p>
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <Input
              label="GitHub profile"
              placeholder="https://github.com/you"
              value={github}
              disabled={disabled}
              error={githubCheck.error ?? undefined}
              onChange={(e) => onGithubChange(e.target.value)}
              onBlur={onFieldBlur}
            />
            {/* A HINT, never an error. github.com/user/repo is a repository rather
                than a profile, and the backend stores it happily — the form submits
                either way. Hard-rejecting someone's own working URL on an OPTIONAL
                field is hostile. Do not turn this into a rejection. */}
            {githubCheck.hint && <p style={hintStyle}>{githubCheck.hint}</p>}
          </div>
          <Input
            label="LinkedIn profile"
            placeholder="https://in.linkedin.com/in/you"
            value={linkedin}
            disabled={disabled}
            error={linkedinError ?? undefined}
            onChange={(e) => onLinkedinChange(e.target.value)}
            onBlur={onFieldBlur}
          />
        </div>
      </div>

      {/* ── Notes ──────────────────────────────────────────────────────────── */}
      <div>
        <Textarea
          label="Notes on your approach (optional)"
          rows={5}
          value={notes}
          disabled={disabled}
          maxLength={MAX_NOTES_LENGTH}
          placeholder="Trade-offs you made, what you'd do with more time, anything the reviewer should know."
          onChange={(e) => onNotesChange(e.target.value.slice(0, MAX_NOTES_LENGTH))}
          onBlur={onFieldBlur}
        />
        <p style={{ ...hintStyle, textAlign: 'right' }}>
          {`${notes.length} / ${MAX_NOTES_LENGTH}`}
        </p>
      </div>
      </Stack>
    </fieldset>
  );
}
