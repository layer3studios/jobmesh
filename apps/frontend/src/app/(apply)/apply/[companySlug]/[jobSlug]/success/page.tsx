// FILE: src/app/(apply)/apply/[companySlug]/[jobSlug]/success/page.tsx
// Post-submit confirmation — Server Component, noindex (robots.ts also disallows
// /apply/*/success). Reads the company + job from the success query params (passed
// by ApplyFormClient); falls back to a generic message on direct navigation (R5).
import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Container, Card, Button, Stack } from '@/components/ui';
import ApplySuccessTracker from '@/components/apply/ApplySuccessTracker';
import SocialLinks from '@/components/apply/SocialLinks';
import { getPublicCompanyServer } from '@/lib/server-api/public';

export const metadata: Metadata = {
  title: 'Application submitted',
  robots: { index: false, follow: false },
};

/**
 * The company is re-fetched rather than read from the query string: the social
 * links have to come from somewhere trustworthy, and a query param a candidate can
 * edit is not it. A failure here is not an error state — the confirmation still
 * stands, it just loses the follow links.
 */
async function loadCompany(companySlug: string) {
  try {
    return (await getPublicCompanyServer(companySlug)).company;
  } catch {
    return null;
  }
}

export default async function ApplySuccessPage({
  params, searchParams,
}: {
  params: Promise<{ companySlug: string; jobSlug: string }>;
  searchParams: Promise<{ company?: string; job?: string; jid?: string }>;
}) {
  const { companySlug } = await params;
  const { company: queryCompanyName, job: jobTitle, jid: jobId } = await searchParams;
  const company = await loadCompany(companySlug);
  const companyName = company?.name ?? queryCompanyName;
  const teamName = companyName ?? 'the';

  return (
    <Container size="sm" style={{ paddingTop: 40, paddingBottom: 60 }}>
      <ApplySuccessTracker companySlug={companySlug} jobId={jobId} />
      <Card variant="raised">
        <Stack gap={14} align="center">
          <CheckCircle2 size={44} color="var(--success)" aria-hidden />
          <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--ink)', textAlign: 'center' }}>
            Application submitted
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--ink)', textAlign: 'center', lineHeight: 1.55 }}>
            {jobTitle && companyName
              ? `You applied to ${jobTitle} at ${companyName}.`
              : 'Your application has been submitted.'}
          </p>

          <div style={{
            width: '100%', borderTop: '0.5px solid var(--border)', paddingTop: 14, marginTop: 2,
          }}>
            <p style={{ margin: '0 0 4px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--ink)', textAlign: 'center' }}>
              What happens next
            </p>
            {/* States the outcome plainly, including the one candidates most often
                do not get: an answer either way. */}
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ink-muted)', textAlign: 'center', lineHeight: 1.6 }}>
              The {teamName} team will review your application. You&rsquo;ll hear back via email either way.
            </p>
          </div>

          {company?.socialLinks && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
                Follow {companyName}
              </span>
              <SocialLinks links={company.socialLinks} companyName={companyName ?? companySlug} />
            </div>
          )}

          <Stack gap={8} align="center">
            <Link href={`/apply/${companySlug}`}>
              <Button variant="secondary">
                {companyName ? `Browse more jobs at ${companyName}` : 'Browse more jobs'}
              </Button>
            </Link>
            <Link href="/" style={{ fontSize: '0.825rem', color: 'var(--link)' }}>
              Back to JobMesh
            </Link>
          </Stack>
        </Stack>
      </Card>
    </Container>
  );
}
