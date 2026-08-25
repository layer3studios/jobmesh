'use client';
// FILE: src/components/seeker/public-profile/ContactModal.tsx
// The way to reach a candidate who kept their email private.
//
// THE SENDER NEVER LEARNS THE ADDRESS. They type a message, we relay it, and the
// success state says the message was sent — not that it was delivered, because
// the backend deliberately returns the same answer either way (a form that
// distinguished the two would be an email-existence oracle for anyone with a list
// of slugs).

import { useState } from 'react';
import { Modal, Button, Input, Textarea, Alert, Stack } from '@/components/ui';
import { sendProfileContact, PublicProfileApiError } from '@/api/public-profile-api';

const MESSAGE_MAX_LENGTH = 500;

export default function ContactModal({ slug, name, open, onClose }: {
  slug: string;
  name: string;
  open: boolean;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ senderName: '', senderEmail: '', message: '', website: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const close = () => {
    onClose();
    // Reset only after the dialog is gone, so the success line does not flicker
    // back to an empty form on the way out.
    setTimeout(() => { setSent(false); setError(null); }, 200);
  };

  const submit = async () => {
    setSending(true);
    setError(null);
    try {
      await sendProfileContact(slug, form);
      setSent(true);
    } catch (err) {
      setError(err instanceof PublicProfileApiError
        ? err.message
        : 'Could not send your message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const canSend = form.senderName.trim() !== ''
    && form.senderEmail.trim() !== ''
    && form.message.trim() !== '';

  return (
    <Modal isOpen={open} onClose={close} title={`Message ${name}`} size="sm">
      {sent ? (
        <Stack gap={10}>
          <Alert type="success">Message sent! {name} will see your message in their inbox.</Alert>
          <Button variant="secondary" onClick={close}>Close</Button>
        </Stack>
      ) : (
        <div className="pp-form">
          {error && <Alert type="error">{error}</Alert>}
          <Input
            label="Your name" value={form.senderName}
            onChange={(e) => set('senderName', e.target.value)}
          />
          <Input
            label="Your email" type="email" value={form.senderEmail}
            onChange={(e) => set('senderEmail', e.target.value)}
          />
          <Textarea
            label="Message" rows={5} maxLength={MESSAGE_MAX_LENGTH} value={form.message}
            hint={`${form.message.length}/${MESSAGE_MAX_LENGTH}`}
            onChange={(e) => set('message', e.target.value)}
          />

          {/* Honeypot — see .pp-honeypot. Hidden from people, tempting to bots. */}
          <div className="pp-honeypot" aria-hidden>
            <label htmlFor="pp-website">Website</label>
            <input
              id="pp-website" name="website" type="text" tabIndex={-1} autoComplete="off"
              value={form.website} onChange={(e) => set('website', e.target.value)}
            />
          </div>

          <Stack gap={8} dir="row">
            <Button loading={sending} disabled={!canSend} onClick={() => void submit()}>Send</Button>
            <Button variant="ghost" onClick={close}>Cancel</Button>
          </Stack>
          <p style={{ fontSize: '0.72rem', color: 'var(--ink-faint)', margin: 0 }}>
            JobMesh relays this to {name}. Your email is shared with them so they can reply.
          </p>
        </div>
      )}
    </Modal>
  );
}
