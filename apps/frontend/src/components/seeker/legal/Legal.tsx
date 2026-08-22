'use client';
// FILE: src/components/seeker/legal/Legal.tsx
import { useState } from 'react';
import { ChevronDown, Mail } from 'lucide-react';
import { Container, PageHeader } from '../../ui';
import { BRAND, COPY } from '../../../theme/brand';

interface Section { title: string; body: string; }

const SECTIONS: Section[] = [
  {
    title: 'Terms of use',
    body: `${BRAND.appName} is a job aggregation platform that collects publicly available job listings. By using the service, you agree to:

• Use the information for personal job-searching purposes only.
• Verify all job details directly with the employer before applying.
• Not copy, mirror, or redistribute the aggregated data.

We make no guarantees about the accuracy, completeness, or availability of any listing. Job listings may be outdated, modified, or removed by the employer at any time.`,
  },
  {
    title: 'Privacy',
    body: `When you sign in with Google, we store:

• Your name, email, and profile photo (from Google).
• Skills you add, applied jobs, daily goal, and dismissed jobs.

We do NOT:

• Send you marketing emails.
• Share your data with third parties.
• Sell your information.

You can delete your account and all associated data at any time by emailing us.`,
  },
  {
    title: 'Data sources',
    body: `Listings are aggregated from publicly available company job postings.

We only surface roles that companies have already made public, and we link directly to the original posting. If you're an employer who wants your listings removed, contact us.`,
  },
  {
    title: 'Cookies',
    body: `We use a single httpOnly cookie to keep you signed in. We do not use tracking cookies, analytics cookies, or advertising cookies.`,
  },
];

export default function Legal() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Container size="md" style={{ paddingTop: 'clamp(24px, 5vw, 40px)', paddingBottom: 60 }}>
      <PageHeader
        label={COPY.legal.pageLabel}
        title={COPY.legal.pageTitle}
        subtitle={COPY.legal.lastUpdated}
      />

      {/* TL;DR */}
      <div style={{
        background: 'var(--accent-soft)',
        border: '1px solid var(--accent-mid)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
      }}>
        <p style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>
          TL;DR
        </p>
        <p style={{ fontSize: '0.9rem', color: 'var(--ink)', lineHeight: 1.55 }}>
          We aggregate public job listings. We don't sell your data, we don't email you. Listings can be outdated, so verify with the employer.
        </p>
      </div>

      {/* Collapsible sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {SECTIONS.map((s, i) => (
          <div key={i} style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            <button
              onClick={() => setOpen(open === i ? null : i)}
              style={{
                width: '100%',
                padding: '14px 18px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontFamily: 'inherit',
                fontSize: '0.95rem',
                fontWeight: 600,
                color: 'var(--ink)',
                textAlign: 'left',
              }}
            >
              {s.title}
              <ChevronDown
                size={14}
                style={{
                  color: 'var(--ink-muted)',
                  transition: 'transform 200ms ease',
                  transform: open === i ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </button>
            {open === i && (
              <div
                className="anim-fade"
                style={{
                  padding: '0 18px 16px',
                  borderTop: '1px solid var(--border)',
                  paddingTop: 14,
                  fontSize: '0.88rem',
                  color: 'var(--ink-muted)',
                  lineHeight: 1.65,
                  whiteSpace: 'pre-line',
                }}
              >
                {s.body}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact */}
      <div style={{
        marginTop: 24,
        background: 'var(--paper-2)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: 18,
      }}>
        <h3 className="font-display" style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
          {COPY.legal.contactTitle}
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', lineHeight: 1.6, marginBottom: 12 }}>
          {COPY.legal.contactBody}
        </p>
        <a
          href="mailto:layer3studios.team@gmail.com"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 9,
            background: 'var(--ink)',
            color: 'var(--paper)',
            textDecoration: 'none',
            fontSize: '0.85rem',
            fontWeight: 500,
          }}
        >
          <Mail size={13} /> layer3studios.team@gmail.com
        </a>
      </div>
    </Container>
  );
}
