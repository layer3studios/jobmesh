'use client';
// FILE: src/components/seeker/legal/Privacy.tsx
// Standalone, public DPDP privacy notice (/legal/privacy). Progressive disclosure:
// a "Key Points" summary Card up top, then expandable sections (R1). Static content
// — the version string is embedded, not fetched.

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { Container, Card, Button, PageHeader, Stack } from '../../ui';
import { NOTICE_VERSION, GRIEVANCE_EMAIL } from '../../shared/consent-copy';
import { KEY_POINTS, SECTIONS } from './PrivacySections';

export default function Privacy() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Container size="md" data-notice-version={NOTICE_VERSION} style={{ paddingTop: 'clamp(24px, 5vw, 40px)', paddingBottom: 60 }}>
      <PageHeader label="LEGAL" title="Privacy Notice" subtitle={`Last updated: ${NOTICE_VERSION}`} />

      <Card variant="raised" style={{ marginBottom: 20 }}>
        <p style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 10 }}>
          Key Points
        </p>
        <Stack gap={8}>
          {KEY_POINTS.map((point) => (
            <p key={point} style={{ fontSize: '0.9rem', color: 'var(--ink)', lineHeight: 1.55 }}>• {point}</p>
          ))}
        </Stack>
      </Card>

      <Stack gap={8}>
        {SECTIONS.map((section, index) => {
          const open = openIndex === index;
          return (
            <Card key={section.title} padding="sm">
              <Button
                variant="link"
                fullWidth
                onClick={() => setOpenIndex(open ? null : index)}
                style={{ justifyContent: 'space-between', color: 'var(--ink)', textDecoration: 'none', fontWeight: 600 }}
              >
                {section.title}
                <ChevronDown size={15} style={{ transition: 'transform 200ms ease', transform: open ? 'rotate(180deg)' : 'none' }} />
              </Button>
              {open && (
                <p style={{ marginTop: 12, fontSize: '0.88rem', color: 'var(--ink-muted)', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
                  {section.body}
                </p>
              )}
            </Card>
          );
        })}
      </Stack>

      <Card variant="raised" style={{ marginTop: 24 }}>
        <Stack gap={10}>
          <h3 className="font-display" style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)' }}>
            Exercise your rights
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', lineHeight: 1.6 }}>
            Withdraw consent, request a copy of your data, or file a grievance from your Account Privacy page.
            Our grievance officer ({GRIEVANCE_EMAIL}) responds within 90 days.
          </p>
          <div>
            <Link href="/account/privacy"><Button variant="secondary">Go to Account Privacy</Button></Link>
          </div>
        </Stack>
      </Card>
    </Container>
  );
}
