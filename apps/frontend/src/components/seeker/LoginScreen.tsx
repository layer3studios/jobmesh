'use client';
// FILE: src/components/seeker/LoginScreen.tsx
// Sign-in as a split: the landing's ink photograph with a serif statement on
// the left, a glass card with the Google button on the right. On phones the
// photograph becomes a dim ground behind a single centred card.
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GoogleLogin } from '@react-oauth/google';
import { useSeeker } from '../../context/seeker/SeekerContext';
import BrandLogo from '../BrandLogo';
import { LOGIN_BENEFITS } from './login-benefits';
import { trackEvent } from '../../lib/analytics-events';
import { getFromRoute } from '../../lib/from-route';
import { Z } from '@/theme/tokens';
import { useViewport } from '@/hooks/shared/useViewport';

const MONO = 'var(--font-jetbrains-mono), ui-monospace, monospace';

export default function LoginScreen() {
  const { login } = useSeeker();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { width: vw, isMobile } = useViewport();
  const split = vw >= 900;
  useEffect(() => { trackEvent('seeker_signup_started', { fromRoute: getFromRoute() }); }, []);

  const onCredential = async (credential?: string) => {
    if (!credential) { setError('Sign-in failed. Please try again.'); return; }
    try {
      setLoading(true); setError(null);
      await login(credential);
      router.push('/');
    } catch { setError('Sign-in failed. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: Z.overlay, background: 'var(--paper)',
      display: 'grid', gridTemplateColumns: split ? '1.1fr 1fr' : '1fr', overflow: 'auto',
    }}>
      {/* Ink photograph — full pane on desktop, dim ground on phones */}
      <div style={{ position: split ? 'relative' : 'absolute', inset: split ? undefined : 0, overflow: 'hidden', minHeight: split ? '100dvh' : undefined }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/landing/ink-hero.jpg" alt="" aria-hidden style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
          opacity: split ? 0.55 : 0.25, filter: 'grayscale(1)',
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(9,9,11,0.2), rgba(9,9,11,0.75))' }} />
        {split && (
          <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 40, color: '#E5E2E1' }}>
            <span style={{ color: '#E5E2E1' }}><BrandLogo size="md" /></span>
            <div>
              <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.7, marginBottom: 14 }}>For people who apply</p>
              <h2 className="font-display" style={{ fontSize: 'clamp(2.2rem, 4vw, 3.4rem)', fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1.02, maxWidth: 520 }}>
                Every open tech role in India. One list, one login.
              </h2>
            </div>
          </div>
        )}
      </div>

      {/* Glass card */}
      <div style={{
        position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? 'max(24px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom))' : 40,
        minHeight: split ? undefined : '100dvh',
      }}>
        <div className="glass glass--strong" style={{ position: 'relative', width: '100%', maxWidth: 420, borderRadius: 18, padding: isMobile ? '28px 22px 24px' : '36px 32px 30px', boxShadow: 'var(--shadow-lg)' }}>
          <Link href="/" aria-label="Back to home" className="jb-icon-btn" style={{
            position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid var(--border)', color: 'var(--ink-muted)', textDecoration: 'none',
          }}>
            <X size={15} />
          </Link>

          {!split && <div style={{ marginBottom: 22 }}><BrandLogo size="md" /></div>}

          <p style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 10 }}>Sign in</p>
          <h1 className="font-display" style={{ fontSize: 'clamp(1.9rem, 4vw, 2.4rem)', fontWeight: 400, color: 'var(--ink)', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 10 }}>
            Welcome back.
          </h1>
          <p style={{ fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.55, marginBottom: 24 }}>
            Track applications, get skill-matched feeds, and keep a daily apply streak.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
            <GoogleLogin
              onSuccess={cr => { void onCredential(cr.credential); }}
              onError={() => setError('Sign-in failed. Please try again.')}
              useOneTap={false}
              shape="rectangular"
              size="large"
              width={isMobile ? Math.min(vw - 80, 320) : 340}
              text="signin_with"
              theme="outline"
            />
          </div>

          {loading && <p style={{ fontSize: 13, color: 'var(--ink-muted)', textAlign: 'center', marginBottom: 12 }}>Signing you in…</p>}
          {error && (
            <div style={{ fontSize: 13, color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: 9, padding: '8px 12px', marginBottom: 16, textAlign: 'center' }}>{error}</div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0 16px', color: 'var(--ink-faint)', fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span>What you get</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            {LOGIN_BENEFITS.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: 'var(--ink-2)' }}>
                <span style={{ width: 26, height: 26, borderRadius: 8, border: '1px solid var(--border)', color: 'var(--ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{b.icon}</span>
                {b.label}
              </div>
            ))}
          </div>

          <p style={{ fontSize: 12, color: 'var(--ink-faint)', textAlign: 'center', marginTop: 22, lineHeight: 1.55 }}>
            We only use Google to identify you. No emails sent, no data shared.{' '}
            <Link href="/legal" style={{ color: 'var(--ink-muted)', textDecoration: 'underline' }}>Privacy & terms</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
