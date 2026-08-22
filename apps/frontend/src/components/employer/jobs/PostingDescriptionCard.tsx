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
    <div style={{ background: 'var(--surface-raised)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Description</p>
        {allowEdit && (
          <Button variant="ghost" size="sm" aria-label="Edit description" onClick={onEdit}>
            <Pencil size={14} />
          </Button>
        )}
      </div>
      <div data-testid="description-scroll" style={{ maxHeight: 380, overflowY: 'auto' }}>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--ink-2)', whiteSpace: 'pre-wrap' }}>
          {description}
        </p>
      </div>
    </div>
  );
}
