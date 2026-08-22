// FILE: src/app/(employer)/employer/(app)/layout.tsx
// Employer AUTH guard (D4, AUTH-PLAN §3). Server Component: server-fetches the
// employer session; a 401 → redirect('/employer/login'). This subtree covers
// onboarding (where company may still be null) but NOT /employer/login, which sits
// outside it. The resolved session seeds the client EmployerProvider (one fetch);
// the real EmployerTopNav renders inside the client EmployerAppShell.
import { redirect } from 'next/navigation';
import { getEmployerMeServer } from '@/lib/server-api/employer';
import { EmployerProvider } from '@/context/employer/EmployerContext';
import EmployerAppShell from '@/components/layouts/EmployerAppShell';

export default async function EmployerAppLayout({ children }: { children: React.ReactNode }) {
  const session = await getEmployerMeServer();
  if (!session) redirect('/employer/login');

  return (
    <EmployerProvider initialUser={session.employerUser} initialCompany={session.company}>
      <EmployerAppShell>{children}</EmployerAppShell>
    </EmployerProvider>
  );
}
