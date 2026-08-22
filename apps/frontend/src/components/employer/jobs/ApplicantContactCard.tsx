'use client';
// FILE: src/components/employer/jobs/ApplicantContactCard.tsx
// Candidate contact details as a "business card" at the top of the applicant sidebar, so
// the employer reaches out from here instead of squinting at the PDF. Every value has a
// one-click copy; email/phone also carry mailto/tel, and profile links open in a new tab.
// Rows render only when the value is present, and the card disappears when there's nothing.

import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Mail, Phone, Linkedin, Github, Globe, MapPin, Copy, Check } from 'lucide-react';
import { Card, Stack } from '@/components/ui';
import DoNotContactBanner from './parts/DoNotContactBanner';
import type { DoNotContact } from '@/types/employer-applicants';

export interface ApplicantContact {
  /** The "never reach out again" flag. Renders first, above everything. */
  doNotContact?: DoNotContact | null;
  email?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  location?: string | null;
}

const LABEL_STYLE = {
  fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em',
  textTransform: 'uppercase' as const, color: 'var(--ink-faint)',
};
const VALUE_STYLE = {
  flex: 1, minWidth: 0, fontSize: '0.85rem', color: 'var(--ink)',
  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
};
const ICON_BTN_STYLE = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 28, height: 28, borderRadius: 8, flexShrink: 0, cursor: 'pointer',
  background: 'transparent', border: '1px solid var(--border)', color: 'var(--ink-muted)',
};
const LINK_STYLE = { color: 'var(--accent)', textDecoration: 'none' };

/** Trim to a non-empty string, or null. Tolerates non-string values (defensive: the
 *  untyped backend could hand us an object for e.g. location — never render/crash on it). */
function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

/** Prefix a bare host (linkedin.com/in/…) so the anchor resolves off-site, not in-app. */
function withProtocol(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/** Digits and a leading + only — tel: URIs must not carry spaces/punctuation (RFC 3966). */
function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);
  async function copy() {
    try {
      await navigator.clipboard?.writeText(value);
      setCopied(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable (denied / insecure context) — leave the icon unchanged */
    }
  }
  return (
    <button type="button" onClick={copy} aria-label={`${copied ? 'Copied' : 'Copy'} ${label}`} style={ICON_BTN_STYLE}>
      {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
    </button>
  );
}

function Row({ icon, children, copyValue, copyLabel }: {
  icon: ReactNode; children: ReactNode; copyValue: string; copyLabel: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ display: 'inline-flex', color: 'var(--ink-faint)', flexShrink: 0 }}>{icon}</span>
      <span style={VALUE_STYLE}>{children}</span>
      <CopyButton value={copyValue} label={copyLabel} />
    </div>
  );
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" style={LINK_STYLE}>{children}</a>;
}

export default function ApplicantContactCard({ contact }: { contact: ApplicantContact }) {
  const email = str(contact.email);
  const phone = str(contact.phone);
  const linkedin = str(contact.linkedinUrl);
  const github = str(contact.githubUrl);
  const portfolio = str(contact.portfolioUrl);
  const location = str(contact.location);

  const doNotContact = contact.doNotContact ?? null;

  // A flagged candidate with no contact details still gets the card: the warning is
  // the most important thing on it, and dropping the card would drop the warning.
  if (!email && !phone && !linkedin && !github && !portfolio && !location && !doNotContact?.flag) return null;

  return (
    // data-ph-mask: applicant contact PII masked in session replay (defence-in-depth).
    <div data-ph-mask style={{ display: 'contents' }}>
    <Card>
      <Stack gap={10}>
        {doNotContact?.flag && <DoNotContactBanner doNotContact={doNotContact} />}
        <div style={LABEL_STYLE}>Contact</div>
        {email && (
          <Row icon={<Mail size={15} aria-hidden="true" />} copyValue={email} copyLabel="email">
            <a href={`mailto:${email}`} style={LINK_STYLE}>{email}</a>
          </Row>
        )}
        {phone && (
          <Row icon={<Phone size={15} aria-hidden="true" />} copyValue={phone} copyLabel="phone">
            <a href={telHref(phone)} style={LINK_STYLE}>{phone}</a>
          </Row>
        )}
        {linkedin && (
          <Row icon={<Linkedin size={15} aria-hidden="true" />} copyValue={withProtocol(linkedin)} copyLabel="LinkedIn URL">
            <ExternalLink href={withProtocol(linkedin)}>LinkedIn profile</ExternalLink>
          </Row>
        )}
        {github && (
          <Row icon={<Github size={15} aria-hidden="true" />} copyValue={withProtocol(github)} copyLabel="GitHub URL">
            <ExternalLink href={withProtocol(github)}>GitHub profile</ExternalLink>
          </Row>
        )}
        {portfolio && (
          <Row icon={<Globe size={15} aria-hidden="true" />} copyValue={withProtocol(portfolio)} copyLabel="portfolio URL">
            <ExternalLink href={withProtocol(portfolio)}>Portfolio</ExternalLink>
          </Row>
        )}
        {location && (
          <Row icon={<MapPin size={15} aria-hidden="true" />} copyValue={location} copyLabel="location">
            {location}
          </Row>
        )}
      </Stack>
    </Card>
    </div>
  );
}
