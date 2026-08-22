// FILE: src/components/seeker/ProfileReviewImprovements.tsx
// Strengths chips + up to 3 improvement blocks (D7). NO GHOSTWRITING (C10/R5):
// each improvement shows the user's OWN bullet as a quote and the recruiter's
// gap as a QUESTION to answer — never a machine-authored replacement, and never
// a text input inviting the user to paste one. The card offers no editable field
// and no copy-a-replacement affordance; the C10 anti-regression test enforces it.

import { Stack, Badge } from '../ui';
import type { ResumeReview } from '../../types/seeker-profile';

interface Props {
  strengths: string[];
  topImprovements: ResumeReview['topImprovements'];
}

export default function ProfileReviewImprovements({ strengths, topImprovements }: Props) {
  return (
    <Stack gap={14}>
      {strengths.length > 0 && (
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginRight: 8 }}>Strengths:</span>
          <span style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap' }}>
            {strengths.slice(0, 3).map((strength, index) => (
              <Badge key={`${strength}-${index}`} variant="success" size="sm">{strength}</Badge>
            ))}
          </span>
        </div>
      )}

      {topImprovements.slice(0, 3).map((improvement, index) => (
        <div key={`${improvement.title}-${index}`} style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>{improvement.title}</p>
          {improvement.observedBullet && (
            <blockquote style={{
              margin: '0 0 8px', padding: '6px 12px', borderLeft: '3px solid var(--border-strong)',
              fontSize: '0.85rem', color: 'var(--ink-2)', fontStyle: 'italic',
            }}>
              You wrote: “{improvement.observedBullet}”
            </blockquote>
          )}
          <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', marginBottom: 6 }}>{improvement.why}</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--ink)' }}>
            <strong>Answer this:</strong> {improvement.question}
          </p>
        </div>
      ))}
    </Stack>
  );
}
