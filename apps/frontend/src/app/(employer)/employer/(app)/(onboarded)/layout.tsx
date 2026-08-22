// FILE: src/app/(employer)/employer/(app)/(onboarded)/layout.tsx
// Employer ONBOARDED guard (D_impl_5). Sits inside the auth guard: it re-reads the
// session and, if the employer has no company yet, redirects to onboarding. The
// onboarding page itself lives one level up (under the auth guard only), so there
// is no redirect loop.
import { redirect } from 'next/navigation';
import { getEmployerMeServer } from '@/lib/server-api/employer';

export default async function EmployerOnboardedLayout({ children }: { children: React.ReactNode }) {
  const session = await getEmployerMeServer();
  if (!session) redirect('/employer/login');
  if (!session.company) redirect('/employer/onboarding');
  return <>{children}</>;
}
