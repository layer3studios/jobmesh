// FILE: src/services/email/templates/sourced-candidate-template.js
// Sent when an employer adds a previously-consenting candidate to a posting's
// pipeline from the Discover tab.
//
// THE LAWFUL BASIS IS NAMED IN THE BODY, not buried in the footer. This person
// ticked "I'm open to being contacted about future roles at {companyName}" on an
// earlier application to THAT SAME company — so the mail says which company,
// says it is about a new role there, and reminds them how to stop. Anyone who
// cannot immediately place why they received it will read it as spam, and they
// would be right to.
//
// It does NOT claim they applied, and it does not promise an interview: an
// employer moved them into a pipeline, which is a real but small thing.

import { renderEmailShell, renderPlainText } from './email-layout-helpers.js';

export function buildSourcedCandidateEmail({ firstName, companyName, postingTitle, applyUrl }) {
  const greeting = firstName ? `Hi ${firstName},` : 'Hi,';
  const shellInput = {
    previewText: `${companyName} would like you to consider ${postingTitle}`,
    headingText: `${companyName} thinks you'd be a great fit`,
    bodyBlocks: [
      greeting,
      `The team at ${companyName} is hiring for ${postingTitle}, and they think your`
      + ' background could be a good match.',
      'They have added you to the shortlist for this role, so you may hear from them'
      + ' directly. You do not need to do anything — but if you would like to see the'
      + ' role first, the link below has the full description.',
      `You're getting this because you told ${companyName} you were open to hearing about`
      + ' their future roles when you applied to them previously.',
    ],
    ...(applyUrl ? { buttonLabel: 'See the role', buttonUrl: applyUrl } : {}),
    footerLines: [
      `Sent by JobMesh on behalf of ${companyName}.`,
      `To stop hearing about future roles at ${companyName}, reply to this email and`
      + ' let them know.',
    ],
  };
  return {
    subject: `${companyName} thinks you'd be a great fit`,
    html: renderEmailShell(shellInput),
    text: renderPlainText(shellInput),
  };
}

export default buildSourcedCandidateEmail;
