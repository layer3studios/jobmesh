'use client';
// FILE: src/components/apply/ApplyFormCard.tsx
// The form column: progress indicator, banners, the field block and the submit
// button.
//
// Split from ApplyFormClient for size (section 2). It decides nothing — every
// value and handler arrives as a prop, and the hook objects (`submit`, `draft`,
// `links`, `screening`) are passed whole rather than exploded into forty props.

import type { RefObject } from 'react';
import { Card, Button, Stack } from '@/components/ui';
import ApplyFormFields from './ApplyFormFields';
import AssignmentSection from './AssignmentSection';
import ApplyProgress from './ApplyProgress';
import ApplyDraftBanner from './ApplyDraftBanner';
import ApplyFormNotices from './ApplyFormNotices';
import ReferralBanner from './ReferralBanner';
import ScreeningQuestionFields from './ScreeningQuestionFields';
import type { ApplyErrors } from './apply-form-helpers';
import type { ApplyFormData, PublicAssignment } from '@/types/public-apply';
import type { useApplyLinks } from './useApplyLinks';
import type { useApplyDraft } from './useApplyDraft';
import type { useApplySubmit } from './useApplySubmit';
import type { useAssignmentFiles } from './useAssignmentFiles';
import type { ApplyScreening } from './useApplyScreening';

export interface ApplyFormCardProps {
  companyName: string;
  companySlug: string;
  assignment: PublicAssignment | null;
  data: ApplyFormData;
  errors: ApplyErrors;
  set: <K extends keyof ApplyFormData>(field: K, value: ApplyFormData[K]) => void;
  onBlur: (field: keyof ApplyFormData) => void;
  onFieldFocus: (field: string) => void;
  showSourceField: boolean;

  progressSections: Array<{ id: string; complete: boolean }>;
  referrerName: string | null;
  deadlineLabel: string | null;
  restoreNotice: string | null;

  screening: ApplyScreening;
  links: ReturnType<typeof useApplyLinks>;
  draft: ReturnType<typeof useApplyDraft>;
  submit: ReturnType<typeof useApplySubmit>;
  uploads: ReturnType<typeof useAssignmentFiles>;

  github: string;
  linkedin: string;
  notes: string;
  onGithubChange: (value: string) => void;
  onLinkedinChange: (value: string) => void;
  onNotesChange: (value: string) => void;

  canSubmit: boolean;
  blockedReason: string | null;
  inFormSubmitRef: RefObject<HTMLDivElement | null>;
}

export default function ApplyFormCard(p: ApplyFormCardProps) {
  const { submit, draft, links, screening, errors } = p;
  const submitting = submit.submitting;

  return (
    <Card className="apply-card" style={{ padding: 20, borderRadius: 10 }}>
      <Stack gap={16}>
        {/* Pinned at the top of the card, above every notice — it describes the
            form as a whole, so it should not move as banners come and go. */}
        <ApplyProgress sections={p.progressSections} />

        {p.referrerName && <ReferralBanner referrerName={p.referrerName} />}

        {draft.draftPrompt && (
          <ApplyDraftBanner onRestore={draft.restoreDraft} onDiscard={draft.discardDraft} />
        )}

        <ApplyFormNotices
          notice={submit.notice}
          deadlineLabel={p.deadlineLabel}
          restoreNotice={p.restoreNotice}
          expiredNotice={submit.expiredNotice}
          formError={errors._form}
          companySlug={p.companySlug}
          copyState={submit.copyState}
          onCopyMyWork={submit.copyMyWork}
          myWorkAsText={submit.myWorkAsText}
        />

        {/* The submission block is passed INTO the field component as a slot so it
            lands between the cover note and the consent checkboxes. It used to
            render after the whole field block, which put the most important part
            of a take-home application underneath a legal checkbox. */}
        <ApplyFormFields
          data={p.data} errors={errors} companyName={p.companyName}
          set={p.set} onBlur={p.onBlur} onFieldFocus={p.onFieldFocus}
          showSourceField={p.showSourceField}
          screeningSlot={screening.questions.length > 0 && (
            <ScreeningQuestionFields
              questions={screening.questions}
              answers={screening.answers}
              errors={screening.errors}
              onChange={screening.setAnswer}
              onBlur={screening.blurAnswer}
            />
          )}
          submissionSlot={p.assignment && (
            <>
              <AssignmentSection
                title={p.assignment.title}
                estimatedHours={p.assignment.estimatedHours}
                allowedFileTypes={p.assignment.allowedFileTypes}
                links={links.links}
                linkErrors={links.linkErrors}
                github={p.github}
                linkedin={p.linkedin}
                notes={p.notes}
                uploads={p.uploads}
                disabled={submitting}
                onLinkChange={links.onLinkChange}
                onLinkBlur={links.onLinkBlur}
                onAddLink={links.onAddLink}
                onRemoveLink={links.onRemoveLink}
                onGithubChange={p.onGithubChange}
                onLinkedinChange={p.onLinkedinChange}
                onNotesChange={p.onNotesChange}
                onFieldBlur={draft.scheduleDraftSave}
              />
              {errors.assignmentLinks && (
                <p role="alert" style={{ color: 'var(--danger)', fontSize: '0.78rem' }}>{errors.assignmentLinks}</p>
              )}
            </>
          )}
        />

        {/* The ONE submit path. The sticky bar calls this exact handler — there is
            no second submit function, and `inFlight` in handleSubmit guards both
            entry points, so a click here and a click there cannot both get through. */}
        <div ref={p.inFormSubmitRef}>
          <Button loading={submitting} disabled={!p.canSubmit} onClick={submit.handleSubmit}>
            Submit application
          </Button>
          {p.blockedReason && (
            <p style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: 6 }}>{p.blockedReason}</p>
          )}
        </div>
      </Stack>
    </Card>
  );
}
