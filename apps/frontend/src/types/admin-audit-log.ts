// FILE: src/types/admin-audit-log.ts
// Shape contract for GET /api/admin/audit-log. Mirrors the backend's
// audit-log-routes projection exactly — no field the backend does not send.

export interface AuditEntry {
  id: string;
  event: string;
  actorType: string | null;
  actorId: string | null;
  targetType: string | null;
  targetId: string | null;
  /** Free-form per-event detail. Never contains invite tokens. */
  metadata: Record<string, unknown>;
  createdAt: string | null;
}

export interface AuditLogPayload {
  entries: AuditEntry[];
  /** Every filterable event name, straight from the backend's enum. */
  events: string[];
}
