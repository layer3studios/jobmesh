'use client';
// FILE: src/components/seeker/LoginScreen.tsx
// Quiet, paper-textured sign-in card. Apple-style focus, no theatre.
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

export default function LoginScreen() {
  const { login } = useSeeker();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [vw, setVw] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1280);

  useEffect(() => {
    const fn = () => setVw(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  useEffect(() => { trackEvent('seeker_signup_started', { fromRoute: getFromRoute() }); }, []); // signup entry point
  const isMobile = vw < 640;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: Z.overlay,
      background: 'var(--paper)',
      display: 'flex',
      alignItems: isMobile ? 'flex-start' : 'center',
      justifyContent: 'center',
      overflow: 'auto',
      padding: isMobile
        ? 'max(20px, env(safe-area-inset-top)) 16px max(20px, env(safe-area-inset-bottom))'
        : '40px 24px',
    }}>
      {/* Subtle grid background (very low opacity) */}
      <div className="grid-bg" style={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none' }} />
      <div className="orb" style={{ width: 380, height: 380, top: '12%', left: '10%', background: 'var(--accent-soft)' }} />
      <div className="orb" style={{ width: 320, height: 320, bottom: '8%', right: '12%', background: 'var(--info-soft)' }} />

      {/* Card */}
      <div className="anim-scale" style={{
        position: 'relative',
        zIndex: 2,
        width: '100%',
        maxWidth: 440,
      }}>
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 18,
          padding: isMobile ? '28px 22px 24px' : '36px 32px 30px',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
        }}>
          {/* Close */}
          <Link
            href="/"
            aria-label="Back to home"
            style={{
              position: 'absolute',
              top: 14, right: 14,
              width: 32, height: 32, borderRadius: 9,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--border)',
              background: 'var(--paper-2)',
              color: 'var(--ink-muted)',
              textDecoration: 'none',
            }}
          >
            <X size={15} />
          </Link>

          {/* Brand */}
          <div style={{ marginBottom: 22 }}>
            <BrandLogo size="md" />
          </div>

          {/* Headline */}
          <h1 className="font-display" style={{
            fontSize: 'clamp(1.6rem, 5vw, 2rem)',
            fontWeight: 600,
            color: 'var(--ink)',
            letterSpacing: '-0.025em',
            lineHeight: 1.15,
            marginBottom: 10,
          }}>
            Welcome back.
          </h1>
          <p style={{
            fontSize: '0.95rem',
            color: 'var(--ink-muted)',
            lineHeight: 1.55,
            marginBottom: 24,
          }}>
            Sign in to track applications, get skill-matched job feeds, and build a daily apply streak.
          </p>

          {/* Google button */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 18,
          }}>
            <GoogleLogin
              onSuccess={async cr => {
                if (cr.credential) {
                  try {
                    setLoading(true); setError(null);
                    await login(cr.credential);
                    router.push('/');
                  } catch { setError('Sign-in failed. Please try again.'); }
                  finally { setLoading(false); }
                } else setError('Sign-in failed. Please try again.');
              }}
              onError={() => setError('Sign-in failed. Please try again.')}
              useOneTap={false}
              shape="rectangular"
              size="large"
              width={isMobile ? Math.min(vw - 80, 320) : 360}
              text="signin_with"
              theme="outline"
            />
          </div>

          {loading && (
            <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', textAlign: 'center', marginBottom: 12 }}>
              Signing you in…
            </p>
          )}
          {error && (
            <div style={{
              fontSize: '0.82rem', color: 'var(--danger)',
              background: 'var(--danger-soft)',
              borderRadius: 9, padding: '8px 12px',
              marginBottom: 16, textAlign: 'center',
            }}>{error}</div>
          )}

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            margin: '22px 0 18px',
            color: 'var(--ink-faint)',
            fontSize: '0.72rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span>What you get</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Benefits */}
          <div style={{ display: 'grid', gap: 9 }}>
            {LOGIN_BENEFITS.map((b, i) => (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: '0.875rem',
                color: 'var(--ink-2)',
              }}>
                <span style={{
                  width: 26, height: 26, borderRadius: 8,
                  background: 'var(--accent-soft)',
                  color: 'var(--accent)',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>{b.icon}</span>
                {b.label}
              </div>
            ))}
          </div>

          {/* Privacy line */}
          <p style={{
            fontSize: '0.72rem',
            color: 'var(--ink-faint)',
            textAlign: 'center',
            marginTop: 22,
            lineHeight: 1.55,
          }}>
            We only use Google to identify you. No emails sent, no data shared.{' '}
            <Link href="/legal" style={{ color: 'var(--ink-muted)', textDecoration: 'underline' }}>Privacy & terms</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
