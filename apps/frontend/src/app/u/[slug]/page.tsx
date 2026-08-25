// FILE: src/app/u/[slug]/page.tsx
// The shareable public profile — Server Component, no auth, SSR'd for SEO and
// for link previews (a crawler fetching an OG card does not run JavaScript).
//
// IT LIVES OUTSIDE EVERY ROUTE GROUP ON PURPOSE. The (seeker) group's layout
// resolves the viewer's session and wraps the page in the signed-in app shell;
// this page is a candidate's personal landing page shown to a stranger, and
// chrome that says "Today / Progress / Profile" would frame it as our product
// instead of their record. The bare domain serves /u/* unrewritten (middleware's
// seeker audience passes paths through), so the URL is jobmesh.in/u/{slug}.
import type { Metadata } from 'next';
import JsonLd from '@/components/schema/JsonLd';
import PublicProfile from '@/components/seeker/public-profile/PublicProfile';
import ProfileNotFound from '@/components/seeker/public-profile/ProfileNotFound';
import { buildPersonSchema } from '@/lib/schema';
import { buildProfileDescription } from '@/lib/public-profile-summary';
import { getPublicProfileServer } from '@/lib/server-api/public-profile';
import { absoluteUrl } from '@/lib/site-url';

export const revalidate = 300;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getPublicProfileServer(slug);

  // A private or unknown profile must not be indexed, and must not leak a title
  // that confirms the slug belongs to someone.
  if (!profile) {
    return { title: 'Profile not found', robots: { index: false, follow: false } };
  }

  const title = `${profile.name}${profile.headline ? ` — ${profile.headline}` : ''}`;
  const description = buildProfileDescription(profile);
  const url = absoluteUrl(`/u/${slug}`);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title, description, url, siteName: 'JobMesh', type: 'profile', locale: 'en_IN',
    },
    // summary, not summary_large_image: there is no per-profile image, and the
    // large card would render as a title over an empty box.
    twitter: { card: 'summary', title, description },
    robots: { index: true, follow: true },
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const profile = await getPublicProfileServer(slug);
  if (!profile) return <ProfileNotFound />;

  return (
    <>
      <JsonLd schema={buildPersonSchema(profile)} />
      <PublicProfile profile={profile} shareUrl={absoluteUrl(`/u/${slug}`)} />
    </>
  );
}
