'use client';
// FILE: src/app/(seeker)/account/privacy/page.tsx
// Account Privacy page — seeker-only. Auth-gated: unauthenticated visitors see the
// login screen; authenticated seekers get the consent manager.
import { useSeeker } from '@/context/seeker/SeekerContext';
import LoginScreen from '@/components/seeker/LoginScreen';
import ConsentManager from '@/components/seeker/consent/ConsentManager';

export default function Page() {
  const { currentUser } = useSeeker();
  if (!currentUser) return <LoginScreen />;
  return <ConsentManager />;
}
