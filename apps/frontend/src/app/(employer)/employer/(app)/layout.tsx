// FILE: src/app/(employer)/employer/(app)/layout.tsx
// Employer AUTH guard (D4, AUTH-PLAN §3). Server Component: server-fetches the
// employer session; a 401 → redirect('/employer/login'). This subtree covers
// onboarding (where company may still be null) but NOT /employer/login, which sits
// outside it. The resolved session seeds the client EmployerProvider (one fetch);
// the real EmployerTopNav renders inside the client EmployerAppShell.
import { notFound, redirect } from 'next/navigation';
import { getEmployerMeServer } from '@/lib/server-api/employer';
import { isEmployerSideEnabled } from '@/lib/server-api/flags';
import { EmployerProvider } from '@/context/employer/EmployerContext';
import EmployerAppShell from '@/components/layouts/EmployerAppShell';

export default async function EmployerAppLayout({ children }: { children: React.ReactNode }) {
  // Closed until the hire half is switched on at /admin/flags. Checked before
  // the session so a signed-in employer cannot keep using it either.
  if (!(await isEmployerSideEnabled())) notFound();

  const session = await getEmployerMeServer();
  if (!session) redirect('/employer/login');

  return (
    <EmployerProvider initialUser={session.employerUser} initialCompany={session.company}>
      <EmployerAppShell>{children}</EmployerAppShell>
    </EmployerProvider>
  );
}
