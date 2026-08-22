// FILE: assignments/page.tsx
// Assignment library (Server Component). Auth + onboarding are guaranteed by the
// parent layouts. Structure mirrors settings/team/page.tsx exactly: parallel
// cookie-forwarding server fetches, a role resolved from the roster, and one client
// island. Reads that a lower role is not allowed to make are treated as empty, not
// as a page failure — the same way team/ treats its Owner-only invites read.
import type { Metadata } from 'next';
import { serverFetch, ServerFetchError } from '@/lib/server-fetch';
import { getEmployerMeServer } from '@/lib/server-api/employer';
import type { TeamMember, Role } from '@/types/employer-team';
import type { Posting } from '@/types/employer-jobs';
import type { EmployerAssignment } from '@/types/employer-assignments';
import AssignmentsClient from './AssignmentsClient';
import { groupUsageByAssignment } from './parts/assignment-usage';

export function generateMetadata(): Metadata {
  return { title: 'Assignments | JobMesh Employer', robots: { index: false } };
}

async function fetchAssignments(): Promise<EmployerAssignment[]> {
  const body = await serverFetch<{ assignments: EmployerAssignment[] }>('/employer/assignments');
  return body.assignments;
}

/**
 * WHY THE POSTINGS LIST IS FETCHED HERE.
 *
 * The "Used by" column and the in-use edit lock both need to know which postings
 * reference each assignment. The library endpoints do not carry that:
 * toPublicAssignment (models/employer/assignment-model.js) projects no usage count,
 * and listJobTitlesUsingAssignment is only ever reached through the 409 path on a
 * refused edit or archive. The alternatives were a request per row — N+1 against an
 * endpoint that would still not return usage — or a backend change, which is out of
 * scope for this chunk.
 *
 * toPublicPosting DOES carry assignmentId, so one extra list read gives the count,
 * the titles and the statuses for every row at once. If the library endpoint later
 * returns usage inline, delete this and read it from there.
 */
async function fetchPostings(): Promise<Posting[]> {
  try {
    const body = await serverFetch<{ postings: Posting[] }>('/employer/jobs');
    return body.postings;
  } catch (error) {
    // A viewer who cannot list postings simply sees no usage data. They also cannot
    // edit or archive, so nothing they are permitted to do depends on it.
    if (error instanceof ServerFetchError && error.status === 403) return [];
    throw error;
  }
}

async function fetchViewerRole(): Promise<Role | null> {
  try {
    const session = await getEmployerMeServer();
    const userId = session?.employerUser.id;
    if (!userId) return null;
    // The /me payload does not carry the company role — it is resolved from the
    // roster, exactly as EmployerContext does on the client.
    const body = await serverFetch<{ members: TeamMember[] }>('/employer/team/members');
    return body.members.find((member) => member.employerUserId === userId)?.role ?? null;
  } catch {
    // Least privilege: an unresolvable role renders the most restricted UI rather
    // than failing the page. The backend is the real gate either way.
    return null;
  }
}

export default async function AssignmentsPage() {
  const [assignments, postings, currentRole] = await Promise.all([
    fetchAssignments(),
    fetchPostings(),
    fetchViewerRole(),
  ]);

  return (
    <AssignmentsClient
      assignments={assignments}
      usageByAssignmentId={groupUsageByAssignment(postings)}
      currentRole={currentRole}
    />
  );
}
