'use client';
// FILE: src/components/analytics/AnalyticsConsentBanner.tsx
// Non-essential-cookies consent banner (DPDP Act 2023). Shown to ALL visitors on
// first visit; hidden once Accept/Decline is chosen. Re-openable from the footer
// "Cookie preferences" link. This banner is the ONLY way analytics consent is granted
// for anonymous + employer traffic — it drives PostHog init via the consent store.
// Rendered at the root so it is present on every route.
import { Button } from '@/components/ui';
import { useAnalyticsConsent } from '@/hooks/useAnalyticsConsent';
import { Z } from '@/theme/tokens';

export default function AnalyticsConsentBanner() {
  const { isBannerOpen, grant, decline } = useAnalyticsConsent();

  if (!isBannerOpen) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      aria-live="polite"
      style={{
        position: 'fixed',
        left: 16,
        right: 16,
        bottom: 16,
        zIndex: Z.overlay,
        maxWidth: 720,
        margin: '0 auto',
        background: 'var(--paper)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <div>
        <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
          We use analytics cookies
        </p>
        <p style={{ fontSize: '0.85rem', color: 'var(--ink-muted)', lineHeight: 1.55 }}>
          With your consent, we use product analytics (including anonymised session
          insights) to understand how JobMesh is used and improve it. Nothing is
          collected until you choose Accept. You can change this anytime from{' '}
          <span style={{ fontWeight: 600 }}>Cookie preferences</span> in the footer.{' '}
          <a
            href="/legal/privacy"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--link)' }}
          >
            Read our Privacy Notice
          </a>
          .
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <Button variant="ghost" size="sm" onClick={decline}>
          Decline
        </Button>
        <Button size="sm" onClick={grant}>
          Accept
        </Button>
      </div>
    </div>
  );
}
