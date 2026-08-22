// FILE: src/api/employer-assignments-api.ts
// Typed client for the assignment library (/api/employer/assignments). Sends the
// employer auth cookie, reads the { assignment } / { assignments } body, throws
// EmployerAssignmentsApiError (status + code + body) on any non-2xx.
// Cookie handling (client): credentials:'include' → the browser attaches jm_employer_token.
// Paths route through API_BASE (C10). Structure mirrors employer-jobs-api.ts.

import { apiUrl } from '../lib/api-base';
import type {
  EmployerAssignment, AssignmentUsage, AssignmentCreateInput, AssignmentPatch,
} from '../types/employer-assignments';

/**
 * Carries the parsed response body, which employer-jobs-api's error does not need to.
 *
 * CANNOT_EDIT_USED_ASSIGNMENT and CANNOT_ARCHIVE_USED_ASSIGNMENT respond 409 with a
 * `jobs` array naming the postings that block the mutation — the backend responds
 * directly rather than throwing HttpError precisely so it can carry that list
 * (employer-assignments-routes.js, refusedAsInUse). Dropping the body here would
 * reduce "in use by Backend Engineer and Platform Engineer" to a bare sentence the
 * employer cannot act on.
 */
export class EmployerAssignmentsApiError extends Error {
  status: number;
  code: string | null;
  body: Record<string, unknown>;

  constructor(status: number, code: string | null, message: string, body: Record<string, unknown> = {}) {
    super(message);
    this.name = 'EmployerAssignmentsApiError';
    this.status = status;
    this.code = code;
    this.body = body;
  }

  /** The blocking postings from a 409, or [] for any other error. */
  get jobs(): AssignmentUsage[] {
    return normalizeUsage(this.body?.jobs);
  }
}

/** Coerce an unknown `jobs` payload into AssignmentUsage[]. Never throws. */
export function normalizeUsage(raw: unknown): AssignmentUsage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object')
    .map((entry) => ({
      id: String(entry.id ?? ''),
      title: typeof entry.title === 'string' ? entry.title : null,
      status: typeof entry.status === 'string' ? entry.status : null,
    }));
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new EmployerAssignmentsApiError(
      response.status,
      body?.code ?? null,
      body?.error || `Request failed (${response.status})`,
      body ?? {},
    );
  }
  return body as T;
}

const assignmentPath = (assignmentId: string) => `/employer/assignments/${encodeURIComponent(assignmentId)}`;

export async function listAssignments(
  { includeArchived = false }: { includeArchived?: boolean } = {},
): Promise<EmployerAssignment[]> {
  // The backend reads the literal string 'true'; omit the param otherwise.
  const query = includeArchived ? '?includeArchived=true' : '';
  const body = await request<{ assignments: EmployerAssignment[] }>(`/employer/assignments${query}`);
  return body.assignments;
}

export async function getAssignment(assignmentId: string): Promise<EmployerAssignment> {
  const body = await request<{ assignment: EmployerAssignment }>(assignmentPath(assignmentId));
  return body.assignment;
}

export async function createAssignment(input: AssignmentCreateInput): Promise<EmployerAssignment> {
  const body = await request<{ assignment: EmployerAssignment }>('/employer/assignments', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  return body.assignment;
}

export async function updateAssignment(assignmentId: string, patch: AssignmentPatch): Promise<EmployerAssignment> {
  const body = await request<{ assignment: EmployerAssignment }>(assignmentPath(assignmentId), {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
  return body.assignment;
}

/** Deep content copy, title suffixed "(copy)" by the backend. Archived sources are clonable. */
export async function cloneAssignment(assignmentId: string): Promise<EmployerAssignment> {
  const body = await request<{ assignment: EmployerAssignment }>(`${assignmentPath(assignmentId)}/clone`, {
    method: 'POST',
  });
  return body.assignment;
}

export async function archiveAssignment(assignmentId: string): Promise<EmployerAssignment> {
  const body = await request<{ assignment: EmployerAssignment }>(`${assignmentPath(assignmentId)}/archive`, {
    method: 'PATCH',
  });
  return body.assignment;
}

export async function unarchiveAssignment(assignmentId: string): Promise<EmployerAssignment> {
  const body = await request<{ assignment: EmployerAssignment }>(`${assignmentPath(assignmentId)}/unarchive`, {
    method: 'PATCH',
  });
  return body.assignment;
}
