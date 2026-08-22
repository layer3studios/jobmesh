'use client';
// FILE: src/components/employer/jobs/parts/PostingEditView.tsx
// Edit mode of the posting Overview tab: form on the left, live preview on the
// right — the same layout as the New-posting page. Extracted from PostingOverview
// purely to keep that file under the 200-line ceiling; behaviour is unchanged.

import { Card } from '@/components/ui';
import PostingForm from '../PostingForm';
import PostingLivePreview from '../PostingLivePreview';
import type { PostingFormValues } from '../posting-form-helpers';
import type { Posting, PostingCreateInput } from '@/types/employer-jobs';

export default function PostingEditView({
  posting, previewValues, onValuesChange, onCancel, onSubmit, onSubmitted,
}: {
  posting: Posting;
  previewValues: PostingFormValues;
  onValuesChange: (values: PostingFormValues) => void;
  onCancel: () => void;
  onSubmit: (input: PostingCreateInput) => Promise<{ id: string } | void>;
  onSubmitted: () => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ flex: '3 1 420px', minWidth: 340 }}>
        <Card variant="raised">
          <PostingForm
            initialValues={{
              title: posting.title, description: posting.description, location: posting.location,
              workplaceType: posting.workplaceType, employmentType: posting.employmentType,
              salaryMin: posting.salaryMin, salaryMax: posting.salaryMax,
            }}
            submitLabel="Save changes"
            onCancel={onCancel}
            onSubmit={onSubmit}
            onSubmitted={onSubmitted}
            postingId={posting.id}
            initialAssignmentId={posting.assignmentId}
            onValuesChange={onValuesChange}
          />
        </Card>
      </div>
      <div style={{ flex: '2 1 300px', minWidth: 280 }}>
        <PostingLivePreview values={previewValues} />
      </div>
    </div>
  );
}
