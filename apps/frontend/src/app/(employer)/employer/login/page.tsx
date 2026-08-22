'use client';
// FILE: src/app/(employer)/employer/login/page.tsx
// Employer sign-in. Sits outside the employer auth guard, so it seeds its own
// EmployerProvider (guest) to power the Google login flow. Renders the ported
// Login component.
import { EmployerProvider } from '@/context/employer/EmployerContext';
import EmployerLogin from '@/components/employer/Login';

export default function Page() {
  return (
    <EmployerProvider>
      <EmployerLogin />
    </EmployerProvider>
  );
}
