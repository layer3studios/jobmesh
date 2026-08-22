// FILE: src/components/apply/ApplyClosedNotice.tsx
// Shown instead of the apply form once a posting's deadline has passed.
//
// The form is not disabled — it is not rendered at all. A greyed-out form invites
// someone to fill it in and discover at the end that it was never going to submit;
// the honest thing is to say so up front and point them at what else is open.

import Link from 'next/link';
import { Container, Card, Button, Stack } from '@/components/ui';

export default function ApplyClosedNotice({
  companySlug, companyName, jobTitle,
}: {
  companySlug: string;
  companyName: string;
  jobTitle: string;
}) {
  return (
    <Container size="sm" style={{ paddingTop: 48, paddingBottom: 64 }}>
      <Card variant="raised">
        <Stack gap={12} align="center">
          <h1 className="font-display" style={{ fontSize: '1.35rem', fontWeight: 600, color: 'var(--ink)', textAlign: 'center' }}>
            Applications for this position have closed
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--ink-muted)', textAlign: 'center', lineHeight: 1.6 }}>
            {companyName} is no longer accepting applications for {jobTitle}.
          </p>
          <Link href={`/apply/${companySlug}`}>
            <Button variant="secondary">See other roles at {companyName}</Button>
          </Link>
        </Stack>
      </Card>
    </Container>
  );
}
