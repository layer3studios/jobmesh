// FILE: src/services/email/profile-contact-service.js
// Delivers a stranger's message from a public profile page to the profile owner.
//
// THE CALLER IS TOLD "SENT" EITHER WAY. Delivery failure is logged, never
// surfaced: a response that differed between "delivered" and "no such mailbox"
// would turn this form into an email-existence oracle for anyone with a list of
// slugs. Validation errors (bad shape, too long) DO surface — those are about the
// sender's own input and reveal nothing about the recipient.

import { sendTransactionalEmail as defaultSendEmail } from './send-email-service.js';
import { buildProfileContactEmail } from './templates/profile-contact-template.js';

export const CONTACT_LIMITS = { name: 80, message: 500 };

// Deliberately loose: the goal is to reject an obvious typo, not to adjudicate
// RFC 5322. Anything stricter rejects real addresses.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate a contact submission. Returns { value } or { error } with a stable code.
 * Trimming happens here so the route stores/sends exactly what was validated.
 */
export function validateContactSubmission(body) {
  const senderName = String(body?.senderName ?? '').trim();
  const senderEmail = String(body?.senderEmail ?? '').trim().toLowerCase();
  const message = String(body?.message ?? '').trim();

  if (!senderName || senderName.length > CONTACT_LIMITS.name) return { error: 'INVALID_NAME' };
  if (!EMAIL_PATTERN.test(senderEmail)) return { error: 'INVALID_EMAIL' };
  if (!message || message.length > CONTACT_LIMITS.message) return { error: 'INVALID_MESSAGE' };

  return { value: { senderName, senderEmail, message } };
}

/**
 * Send the message to the profile owner. Never throws, and never reports whether
 * delivery succeeded — see the header.
 */
export async function sendProfileContactMessage(
  { recipientEmail, senderName, senderEmail, message, profileUrl },
  deps = {},
) {
  const { sendEmail = defaultSendEmail } = deps;
  if (!recipientEmail) {
    // A published profile whose owner has no address on file. Nothing to do, and
    // nothing the sender should learn from it.
    console.warn('[profile-contact] no recipient address for a published profile');
    return;
  }
  try {
    const email = buildProfileContactEmail({ senderName, senderEmail, message, profileUrl });
    const result = await sendEmail({ to: recipientEmail, ...email });
    if (!result?.sent) console.warn('[profile-contact] not delivered:', result?.code);
  } catch (error) {
    console.warn('[profile-contact] send threw:', error.message);
  }
}
