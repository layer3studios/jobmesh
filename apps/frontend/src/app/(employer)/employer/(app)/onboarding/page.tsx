'use client';
// FILE: src/app/(employer)/employer/(app)/onboarding/page.tsx
// One-time company setup. Sits inside the employer auth guard (auth enforced by
// the layout) but outside the onboarded guard. Renders the ported Onboarding.
import Onboarding from '@/components/employer/onboarding/Onboarding';

export default function Page() {
  return <Onboarding />;
}
