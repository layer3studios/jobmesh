'use client';
// FILE: assignments/parts/AssignmentDetailView.tsx
// The LOCKED view of an assignment — what you get when a task is in use by one or
// more postings and can therefore no longer be edited.
//
// WHY THIS IS TEXT AND NOT A DISABLED FORM.
// The obvious implementation is the create form with `disabled` on every input, and
// it is worse in every way that matters. A disabled input renders in a muted grey
// that fails contrast for the very content someone came here to READ; it is skipped
// by screen-reader form navigation and, in several browsers, is not reachable by
// keyboard at all, so a 20,000-character description becomes unscrollable; and a
// long value is clipped to the width of a control that no longer accepts input.
// Reading is the only thing this view supports, so it renders as a document:
// label + value, with the markdown fields through the shared renderer.
//
// Do not "simplify" this into <AssignmentFormModal readOnly />.

import Markdown from '@/components/shared/Markdown';
import { Badge } from '@/components/ui/Badge';
import type { EmployerAssignment, AssignmentUsage } from '@/types/employer-assignments';

const labelStyle: React.CSSProperties = {
  fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)',
  textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 4px',
};
const valueStyle: React.CSSProperties = {
  fontSize: '0.9rem', color: 'var(--ink)', margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap',
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={labelStyle}>{label}</p>
      {children}
    </div>
  );
}

interface Props {
  assignment: EmployerAssignment;
  usedBy: AssignmentUsage[];
}

export default function AssignmentDetailView({ assignment, usedBy }: Props) {
  const fileTypes = assignment.allowedFileTypes ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {usedBy.length > 0 && (
        <div style={{ padding: '11px 14px', borderRadius: 10, background: 'var(--info-soft)', color: 'var(--info)', fontSize: '0.85rem', lineHeight: 1.55 }}>
          <p style={{ margin: 0, fontWeight: 500 }}>
            {`In use by ${usedBy.length} ${usedBy.length === 1 ? 'posting' : 'postings'}. `}
            Editing is locked so candidates answering it all see the same task. Clone it to make changes.
          </p>
          <p style={{ margin: '4px 0 0' }}>
            {usedBy.map((job) => job.title ?? 'Untitled posting').join(', ')}
          </p>
        </div>
      )}

      <Field label="Title">
        <p style={valueStyle}>{assignment.title}</p>
      </Field>

      <Field label="Public summary">
        <p style={valueStyle}>{assignment.publicSummary}</p>
      </Field>

      <Field label="Description">
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>
          <Markdown>{assignment.descriptionMarkdown}</Markdown>
        </div>
      </Field>

      {assignment.submissionInstructionsMarkdown ? (
        <Field label="Submission instructions">
          <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '10px 12px' }}>
            <Markdown>{assignment.submissionInstructionsMarkdown}</Markdown>
          </div>
        </Field>
      ) : null}

      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
        <Field label="Estimated hours">
          <p style={valueStyle}>{`${assignment.estimatedHours} ${assignment.estimatedHours === 1 ? 'hour' : 'hours'}`}</p>
        </Field>
        <Field label="Accepts">
          {/* An empty list is meaningful, not missing: the employer configured a
              link-only submission. Say that rather than showing an empty row. */}
          {fileTypes.length > 0 ? (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {fileTypes.map((type) => <Badge key={type} variant="neutral">{type.toUpperCase()}</Badge>)}
            </div>
          ) : (
            <p style={valueStyle}>Link only</p>
          )}
        </Field>
      </div>
    </div>
  );
}
