// FILE: settings/assignments/page.tsx
// REDIRECT ONLY. The assignment library moved to /employer/assignments — it is
// attached to postings, not to company configuration, so it belongs beside Jobs
// in the top nav rather than inside Settings.
//
// This stub stays because the old path is already out in the world: bookmarks,
// the settings sidebar as it shipped, and any link an employer pasted to a
// colleague. Deleting it would 404 all of them.
//
// permanentRedirect (308) rather than redirect (307): the move is permanent, and
// a 308 lets browsers and crawlers stop asking.
import { permanentRedirect } from 'next/navigation';
import { EMPLOYER_ROUTES } from '@/components/layouts/parts/routes';

export default function AssignmentsSettingsRedirect(): never {
  permanentRedirect(EMPLOYER_ROUTES.ASSIGNMENTS);
}
