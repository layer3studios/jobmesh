// FILE: settings/email/rejection-template-defaults.ts
// The built-in rejection bodies, transcribed from the backend templates in
// services/email/templates/rejection-*.js, plus the same variable substitution the
// sender performs.
//
// A transcription, not an import — the backend renders these into an HTML email
// shell and the frontend cannot reach that code. If the wording changes there, it
// must change here too. They are shown as placeholder text so an employer can see
// exactly what goes out today before deciding to override it.

export type RejectionStageKey = 'application' | 'positionFilled' | 'postInterview';

export interface RejectionStage {
  key: RejectionStageKey;
  title: string;
  subtitle: string;
  defaultBody: string;
}

export const REJECTION_STAGES: RejectionStage[] = [
  {
    key: 'application',
    title: 'Application rejection',
    subtitle: 'Sent when you archive a candidate before any interview.',
    defaultBody: [
      'Hi {firstName},',
      'Thank you for applying for the {jobTitle} position at {companyName}.',
      'We have reviewed your application carefully and have decided not to move forward at this time.',
      'We will keep your profile on file and reach out if a future opening looks like a better match.',
      'We wish you the very best in your search.',
      '— The {companyName} team',
    ].join('\n\n'),
  },
  {
    key: 'positionFilled',
    title: 'Position filled',
    subtitle: 'Sent to everyone still waiting when you mark a role as filled.',
    defaultBody: [
      'Hi {firstName},',
      'Thank you for your interest in the {jobTitle} position at {companyName}.',
      'The position has now been filled. We appreciate the time you invested in your application.',
      'We will keep your profile on file for future opportunities that match your experience.',
      'We wish you the very best in your search.',
      '— The {companyName} team',
    ].join('\n\n'),
  },
  {
    key: 'postInterview',
    title: 'Post-interview rejection',
    subtitle: 'Sent when you archive a candidate at or after the interview stage.',
    defaultBody: [
      'Hi {firstName},',
      'Thank you for taking the time to interview for the {jobTitle} position at {companyName}. '
        + 'We enjoyed the conversation and appreciated the chance to learn about your experience.',
      'After careful consideration, we have decided to move forward with other candidates for this role.',
      'We will keep your profile in mind for future openings.',
      'We wish you every success in your search.',
      '— The {companyName} team',
    ].join('\n\n'),
  },
];

/** Sample values for the preview. Real company name, invented candidate and role. */
export const PREVIEW_SAMPLE = {
  firstName: 'Priya',
  jobTitle: 'Senior React Developer',
};

const PLACEHOLDER_PATTERN = /\{(firstName|jobTitle|companyName)\}/g;

/**
 * Mirrors substituteVariables in the backend's rejection-template-helpers.js: a
 * missing value becomes an empty string, never the literal "{undefined}". The
 * preview must show exactly what the candidate would receive.
 */
export function renderTemplate(body: string, values: Record<string, string>): string {
  return String(body ?? '').replace(
    PLACEHOLDER_PATTERN,
    (_match, key: string) => values[key] ?? '',
  );
}
