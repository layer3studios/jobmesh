'use client';
// FILE: src/components/employer/jobs/New.tsx
// Create-posting page: the form on the left, a sticky live preview on the
// right (stacked on narrow screens). Submit/analytics behaviour unchanged —
// PostingForm still owns validation and errors.

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container, Card, PageHeader, Alert, SkeletonCard, useToast } from '@/components/ui';
import Breadcrumbs from '@/components/employer/Breadcrumbs';
import PostingForm from '@/components/employer/jobs/PostingForm';
import PostingLivePreview from '@/components/employer/jobs/PostingLivePreview';
import type { PostingFormValues } from '@/components/employer/jobs/posting-form-helpers';
import { createEmployerPosting } from '@/api/employer-jobs-api';
import type { PostingCreateInput } from '@/types/employer-jobs';
import { trackEvent } from '@/lib/analytics-events';
import { getFromRoute } from '@/lib/from-route';
import { useBackOrFallback } from '@/hooks/employer/useBackOrFallback';
import { useDuplicateSource } from '@/hooks/employer/useDuplicateSource';

const EMPTY_VALUES: PostingFormValues = {
  title: '', description: '', location: '', workplaceType: '', employmentType: '',
  salaryMinStr: '', salaryMaxStr: '', applicationDeadline: '', autoCloseOnDeadline: false,
};

export default function EmployerJobsNew() {
  const router = useRouter();
  const { showToast } = useToast();
  const [previewValues, setPreviewValues] = useState<PostingFormValues>(EMPTY_VALUES);
  const duplicateId = useSearchParams().get('duplicate');
  const duplicate = useDuplicateSource(duplicateId);
  // Cancel returns to wherever the user opened the form from (Dashboard, Jobs,
  // a posting) — not a hard-coded route. Direct URL access falls back to Jobs.
  const cancel = useBackOrFallback('/employer/jobs');

  // New-posting form opened.
  useEffect(() => { trackEvent('posting_form_opened', { fromRoute: getFromRoute() }); }, []);

  // Returns the posting instead of navigating: PostingForm may still have an
  // assignment to attach as a second request, and routing away here would unmount
  // the form mid-flight and strand it. Navigation moves to onSubmitted, which only
  // fires once the whole save — posting AND attachment — has succeeded.
  const handleCreate = async (input: PostingCreateInput) => {
    const posting = await createEmployerPosting(input);
    trackEvent('posting_created', {
      postingId: posting.id,
      isDraft: posting.status === 'draft',
      isPublished: posting.status === 'active',
    });
    showToast('success', `Posting created: ${posting.title}`);
    return posting;
  };

  return (
    <div style={{ background: 'var(--surface-sunken)', padding: '16px 0' }}>
      <Container size="wide">
        <Breadcrumbs items={[{ label: 'Jobs', href: '/employer/jobs' }, { label: 'New posting' }]} />
        <PageHeader title="New posting" compact />
        {duplicate.sourceTitle && (
          <div style={{ marginBottom: 12 }}>
            <Alert type="info">
              Duplicated from {duplicate.sourceTitle}. Edit and publish when ready.
            </Alert>
          </div>
        )}
        {duplicate.error && (
          <div style={{ marginBottom: 12 }}><Alert type="warning">{duplicate.error}</Alert></div>
        )}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: '3 1 420px', minWidth: 340 }}>
            <Card variant="raised">
              {/* The form seeds its fields once, in a useState initializer, so it must
                  not mount until the duplicated values are in hand. */}
              {duplicate.isLoading ? <SkeletonCard lines={6} /> : (
                /* No postingId and no applicationCount: on create there is no posting to
                   attach to yet, so the assignment section knows it is the create surface
                   and never asks for a confirm. */
                <PostingForm
                  initialValues={duplicate.initialValues ?? undefined}
                  submitLabel="Create posting"
                  onSubmit={handleCreate}
                  onSubmitted={(result) => {
                    if (result && 'id' in result) router.push(`/employer/jobs/${result.id}`);
                  }}
                  onCancel={cancel}
                  onValuesChange={setPreviewValues}
                />
              )}
            </Card>
          </div>
          {/* Sticky so the preview stays in view while the form is filled in; 80px
              clears the fixed nav. */}
          <div style={{ flex: '2 1 300px', minWidth: 280, position: 'sticky', top: 80 }}>
            <PostingLivePreview values={previewValues} />
          </div>
        </div>
      </Container>
    </div>
  );
}
