// FILE: src/types/admin-email-log.ts
// Shape contract for GET /api/admin/email-log.

export interface EmailEvent {
  id: string;
  resendEmailId: string | null;
  /** Short tail of Resend's type, e.g. 'delivered' from 'email.delivered'. */
  type: string;
  rawType: string | null;
  to: string | null;
  subject: string | null;
  occurredAt: string | null;
}

export interface EmailLogPayload {
  events: EmailEvent[];
  /** False when RESEND_WEBHOOK_SECRET is unset — an empty log then means "not wired up". */
  configured: boolean;
}
