// FILE: src/services/email/templates/profile-contact-template.js
// "Someone viewed your public profile and wants to connect."
//
// The sender is an ANONYMOUS STRANGER — nothing about them has been verified, and
// the address they typed is the only way to answer. So the email says exactly
// that, quotes the message in full (it is capped at 500 characters upstream), and
// puts the reply address in front of the candidate rather than wiring a reply-to
// header that would imply we vouched for it.

import { renderEmailShell, renderPlainText } from './email-layout-helpers.js';

export function buildProfileContactEmail({ senderName, senderEmail, message, profileUrl }) {
  const shellInput = {
    previewText: `${senderName} saw your JobMesh profile and wants to connect`,
    headingText: `${senderName} wants to connect`,
    bodyBlocks: [
      `Someone viewed your public profile and sent you a message through JobMesh.`,
      `${senderName} (${senderEmail}) wrote:`,
      `"${message}"`,
      `Reply directly to ${senderEmail} if you want to continue the conversation.`,
    ],
    buttonLabel: 'View your public profile',
    buttonUrl: profileUrl,
    footerLines: [
      'JobMesh has not verified this sender or their email address.',
      'You received this because your JobMesh profile is public. Turn it off any time in your profile settings.',
    ],
  };
  return {
    subject: `${senderName} messaged you through your JobMesh profile`,
    html: renderEmailShell(shellInput),
    text: renderPlainText(shellInput),
  };
}
