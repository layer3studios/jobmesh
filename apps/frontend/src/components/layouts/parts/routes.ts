// FILE: src/components/layouts/parts/routes.ts
// Route-string constants for the employer + admin nav. In the Vite app these lived
// in EmployerAppLayout.tsx / AdminAppLayout.tsx; in the Next App Router those layout
// files are server route segments, so the shared constants live here (imported by
// both the nav parts and the app-shell components).

export const EMPLOYER_ROUTES = {
  DASHBOARD: '/employer',
  JOBS: '/employer/jobs',
  // Assignments are attached to POSTINGS, not to company configuration, so the
  // library sits beside Jobs rather than under Settings. The old
  // /employer/settings/assignments path still resolves, via a 308 stub.
  ASSIGNMENTS: '/employer/assignments',
  // The nav points at the settings INDEX now that there is more than one subpage.
  SETTINGS: '/employer/settings',
  SETTINGS_TEAM: '/employer/settings/team',
} as const;

export const ADMIN_ROUTES = {
  HOME: '/admin',
  EMPLOYER_ACCESS: '/admin/employer-access',
  ANALYTICS: '/admin/analytics',
  AI_USAGE: '/admin/ai-usage',
  DPDP: '/admin/dpdp',
} as const;
