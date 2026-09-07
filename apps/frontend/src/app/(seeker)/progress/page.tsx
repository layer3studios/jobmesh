// FILE: src/app/(seeker)/progress/page.tsx
// /progress retired: its widgets (goal ring, streak, 7-day chart, funnel)
// live on /today now. Old links and bookmarks land there.
import { redirect } from 'next/navigation';

export default function ProgressRedirect() {
  redirect('/today');
}
