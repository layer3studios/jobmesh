'use client';
// FILE: src/components/employer/jobs/PostingDescriptionCard.tsx
// Right Overview card: the JD in a scrollable well, with an Edit escape hatch
// in the header (opens the existing inline editor).

import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui';

export default function PostingDescriptionCard({
  description, onEdit, allowEdit,
}: {
  description: string;
  onEdit: () => void;
  allowEdit: boolean;
}) {
  return (
    <div className="glass" style={{ borderRadius: 14, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <p style={{ margin: 0, fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>Description</p>
        {allowEdit && (
          <Button variant="ghost" size="sm" aria-label="Edit description" onClick={onEdit}>
            <Pencil size={14} />
          </Button>
        )}
      </div>
      <div data-testid="description-scroll" style={{ maxHeight: 380, overflowY: 'auto' }}>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: 'var(--ink-2)', whiteSpace: 'pre-wrap' }}>
          {description}
        </p>
      </div>
    </div>
  );
}
