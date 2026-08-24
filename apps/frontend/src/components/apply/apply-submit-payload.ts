// FILE: src/components/apply/apply-submit-payload.ts
// Builds the multipart body for one application.
//
// Split from useApplySubmit for size (section 2). Pure: it reads the form values
// and returns FormData, touching no state and no network — which makes the exact
// wire format checkable in isolation, and this is the one place field names have
// to agree with the backend.

import type { UseApplySubmitOptions } from './useApplySubmit';
import { answerFieldName } from './ScreeningQuestionFields';

export function buildApplyFormData(o: UseApplySubmitOptions): FormData {
  const { data, assignment, uploads } = o;
    const form = new FormData();
    form.append('firstName', data.firstName.trim());
    form.append('lastName', data.lastName.trim());
    form.append('email', data.email.trim());
    form.append('phone', data.phone.trim());
    form.append('coverNote', data.coverNote.trim());
    // Sent only when non-empty: an empty string would be a value the server has
    // to reason about, where an absent key is simply "not offered".
    if (data.leetcodeUsername.trim()) form.append('leetcodeUsername', data.leetcodeUsername.trim());
    if (data.githubUsername.trim()) form.append('githubUsername', data.githubUsername.trim());
    form.append('consent_dpdp', String(data.consent_dpdp));
    form.append('consent_futureOpportunities', String(data.consent_futureOpportunities));
    form.append('website_url', data.honeypot);
    // Sent as utm_source: apply-service already reads that key into
    // application.sourceDetail, so this needs no new backend field.
    if (data.source) form.append('utm_source', data.source);
    // Re-validated server-side against this posting's company; an expired or
    // deactivated token is ignored there rather than failing the application.
    if (o.referralToken) form.append('referralToken', o.referralToken);
    // One flat field per question — multipart cannot carry nested objects, and a
    // JSON blob here would be the only field on this form the backend has to parse.
    for (const question of o.screeningQuestions) {
      const answer = o.screeningAnswers[question.id];
      if (answer != null && answer.trim() !== '') form.append(answerFieldName(question.id), answer.trim());
    }
    if (data.resume) form.append('resume', data.resume);

    if (assignment) {
      // assignmentId is REQUIRED. The backend's drift check compares it against
      // posting.assignmentId; omitting it fails every assignment apply with
      // MISSING_ASSIGNMENT_ID before anything else is read.
      form.append('assignmentId', assignment.id);
      for (const link of o.validLinks) form.append('assignmentLinks[]', link);
      for (const row of uploads.doneFiles) {
        if (row.fileId) form.append('assignmentFileIds[]', row.fileId);
      }
      form.append('assignmentNotesMarkdown', o.notes.trim());
      form.append('githubUrl', o.github.trim());
      form.append('linkedinUrl', o.linkedin.trim());
    }
    return form;
  return form;
}

export default buildApplyFormData;
