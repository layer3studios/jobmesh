'use client';
// FILE: src/app/(seeker)/login/page.tsx
// Seeker sign-in. Renders the ported LoginScreen (Google OAuth via
// @react-oauth/google). Client component; no SEO. Mirrors the Vite `/login` route
// which rendered LoginScreen directly.
import LoginScreen from '../../../components/seeker/LoginScreen';

export default function LoginPage() {
  return <LoginScreen />;
}
