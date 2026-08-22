// FILE: src/app/(seeker)/layout.tsx
// Server layout for the seeker audience. Reads the seeker cookie server-side and
// seeds the client SeekerProvider (D3) — guest-tolerant (no redirect on 401). The
// real TopNav / BottomNav / Footer render inside the client SeekerAppShell.
import { getSeekerMeServer } from '../../lib/server-api/seeker';
import { SeekerProvider } from '../../context/seeker/SeekerContext';
import SeekerAppShell from '../../components/layouts/SeekerAppShell';
import type { AppUser } from '../../context/seeker/seeker-context-types';

export default async function SeekerLayout({ children }: { children: React.ReactNode }) {
  const me = await getSeekerMeServer();
  const initialUser: AppUser | null = me
    ? { name: me.name, email: me.email, picture: me.picture, slug: me.slug }
    : null;

  return (
    <SeekerProvider initialUser={initialUser}>
      <SeekerAppShell>{children}</SeekerAppShell>
    </SeekerProvider>
  );
}
