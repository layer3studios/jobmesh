// FILE: settings/team/page.tsx
// Team settings (Server Component). Auth + onboarding are guaranteed by the parent
// layouts. Fetches the roster + pending invites in parallel via the cookie-forwarding
// server-fetch helper, resolves the current member from the seeded session, and hands
// everything to the client subtree. The invites read is Owner+ only, so a Member /
// Interviewer viewer 403s there — treated as an empty list, not a page failure.
import type { Metadata } from 'next';
import { serverFetch, ServerFetchError } from '@/lib/server-fetch';
import { getEmployerMeServer } from '@/lib/server-api/employer';
import type { TeamMember, CompanyInvite } from '@/types/employer-team';
import TeamSettingsClient from './TeamSettingsClient';

export function generateMetadata(): Metadata {
  return { title: 'Team | JobMesh Employer', robots: { index: false } };
}

async function fetchMembers(): Promise<TeamMember[]> {
  const body = await serverFetch<{ members: TeamMember[] }>('/employer/team/members');
  return body.members;
}

async function fetchInvites(): Promise<CompanyInvite[]> {
  try {
    const body = await serverFetch<{ invites: CompanyInvite[] }>('/employer/team/invites');
    return body.invites;
  } catch (error) {
    // Owner+ only — a Member / Interviewer reads the roster but not the invites.
    if (error instanceof ServerFetchError && error.status === 403) return [];
    throw error;
  }
}

export default async function TeamSettingsPage() {
  const [session, members, invites] = await Promise.all([
    getEmployerMeServer(),
    fetchMembers(),
    fetchInvites(),
  ]);

  const currentUserId = session?.employerUser.id ?? null;
  const currentMember = currentUserId
    ? members.find((m) => m.employerUserId === currentUserId) ?? null
    : null;

  return <TeamSettingsClient members={members} invites={invites} currentMember={currentMember} />;
}
