// FILE: src/components/apply/AssignmentPreview.tsx
// The take-home panel on the job apply page, shown above the form. Server
// Component — static server-fetched content, no interactivity needed.
//
// The full task is present in the DOM, unconditionally. Chunk 6 returns it on a
// public endpoint by design, so collapsing it behind <details> is a UX choice
// (don't wall the job description off behind a task the candidate hasn't agreed to
// yet), NOT a gate. Nothing here truncates or withholds it.

import { Card, Stack } from '@/components/ui';
import Markdown from '@/components/shared/Markdown';
import AssignmentBadge from './AssignmentBadge';
import type { PublicAssignment } from '@/types/public-apply';

interface Props {
  assignment: PublicAssignment;
}

export default function AssignmentPreview({ assignment }: Props) {
  return (
    <Card>
      <Stack gap={10}>
        <AssignmentBadge
          estimatedHours={assignment.estimatedHours}
          allowedFileTypes={assignment.allowedFileTypes}
          size="md"
        />

        <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)' }}>
          {assignment.title}
        </h2>

        {/* Said plainly and early: the take-home IS the application, not a second
            round they'd be invited to later. That ambiguity is what makes
            candidates abandon at this point. */}
        <p style={{ fontSize: '0.88rem', color: 'var(--ink-muted)', lineHeight: 1.6 }}>
          This role includes a short take-home you&apos;ll complete as part of applying
          — there&apos;s no separate step.
        </p>

        {/* publicSummary is a plain-text field on the backend, not markdown. */}
        <p style={{ fontSize: '0.9rem', color: 'var(--ink-2)', lineHeight: 1.65 }}>
          {assignment.publicSummary}
        </p>

        {/* Native <details>, not a useState toggle: it keeps this a Server
            Component, works with JavaScript disabled, and is keyboard accessible
            and screen-reader announced for free. */}
        <details>
          <summary
            style={{
              cursor: 'pointer', fontSize: '0.86rem', fontWeight: 500,
              color: 'var(--link)', padding: '2px 0',
            }}
          >
            Preview the full task
          </summary>
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            <Markdown>{assignment.descriptionMarkdown}</Markdown>

            {/* The TASK lives here, in the JD column, next to (not above) the input
                fields — on desktop this column scrolls while the form stays pinned,
                so the candidate reads the instructions and fills the fields side by
                side. The form card deliberately holds no copy of this text. */}
            {assignment.submissionInstructionsMarkdown && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
                  How to submit
                </h3>
                <Markdown>{assignment.submissionInstructionsMarkdown}</Markdown>
              </div>
            )}
          </div>
        </details>
      </Stack>
    </Card>
  );
}
