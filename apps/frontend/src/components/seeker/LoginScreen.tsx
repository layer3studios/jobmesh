'use client';
// FILE: src/components/seeker/LoginScreen.tsx
// Seeker sign-in. The shared AuthLayout frame (ink photograph + glass card)
// with the Google button, a loading state that keeps the card's shape, an
// error that shakes once, and the four things a signed-in seeker gets.
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GoogleLogin } from '@react-oauth/google';
import { useSeeker } from '../../context/seeker/SeekerContext';
import AuthLayout from '../layouts/AuthLayout';
import { LOGIN_BENEFITS } from './login-benefits';
import { trackEvent } from '../../lib/analytics-events';
import { getFromRoute } from '../../lib/from-route';
import { useViewport } from '@/hooks/shared/useViewport';

const MONO = 'var(--font-jetbrains-mono), ui-monospace, monospace';
const SIGN_IN_FAILED = 'Sign-in didn’t go through. Try again — nothing was saved.';

export default function LoginScreen() {
  const { login } = useSeeker();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { width: vw, isMobile } = useViewport();
  useEffect(() => { trackEvent('seeker_signup_started', { fromRoute: getFromRoute() }); }, []);

  const fail = () => { setError(null); requestAnimationFrame(() => setError(SIGN_IN_FAILED)); };

  const onCredential = async (credential?: string) => {
    if (!credential) { fail(); return; }
    try {
      setLoading(true); setError(null);
      await login(credential);
      router.push('/');
    } catch { setLoading(false); fail(); }
  };

  return (
    <AuthLayout
      image="/landing/ink-hero.jpg"
      eyebrow="For people who apply"
      statement="Every open tech role in India. One list, one login."
      cardAction={(
        <Link href="/" aria-label="Back to home" className="auth-close press">
          <X size={15} />
        </Link>
      )}
    >
      <p className="auth-eyebrow" style={{ fontFamily: MONO }}>Sign in</p>
      <h1 className="font-display auth-title">Welcome back.</h1>
      <p className="auth-lede">
        Track applications, get skill-matched feeds, and keep a daily apply streak.
      </p>

      {/* The button and the "signing in" state share one slot so the card
          never changes height while Google does its work. */}
      <div className="auth-google" aria-live="polite" data-loading={loading || undefined}>
        {loading ? (
          <div className="auth-google__wait">
            <span className="auth-google__dot" aria-hidden />
            Signing you in…
          </div>
        ) : (
          <GoogleLogin
            onSuccess={cr => { void onCredential(cr.credential); }}
            onError={fail}
            useOneTap={false}
            shape="rectangular"
            size="large"
            width={isMobile ? Math.min(vw - 80, 320) : 340}
            text="signin_with"
            theme="outline"
          />
        )}
      </div>

      {error && (
        <div role="alert" className="auth-error shake">{error}</div>
      )}

      <div className="auth-rule" style={{ fontFamily: MONO }}>
        <span>What you get</span>
      </div>

      <ul className="auth-benefits">
        {LOGIN_BENEFITS.map((b, i) => (
          <li key={i} className="auth-benefit" style={{ '--i': i } as React.CSSProperties}>
            <span className="auth-benefit__icon">{b.icon}</span>
            {b.label}
          </li>
        ))}
      </ul>

      <p className="auth-fine">
        We only use Google to identify you. No emails sent, no data shared.{' '}
        <Link href="/legal">Privacy & terms</Link>
      </p>
    </AuthLayout>
  );
}
