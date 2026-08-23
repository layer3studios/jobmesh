// FILE: src/components/apply/assignment-file-helpers.ts
// Pure helpers behind the assignment upload rows: the client-side row id, the
// file extension, and the size shown in an error. Split out of
// useAssignmentFiles.ts (section 2) -- none of these touch React, so they are
// testable without rendering a hook.

let localIdCounter = 0;

function nextLocalId(): string {
  localIdCounter += 1;
  return `af-${localIdCounter}`;
}

function extensionOf(name: string): string {
  const parts = String(name || '').split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

function formatMegabytes(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))}MB`;
}

export { nextLocalId, extensionOf, formatMegabytes };
