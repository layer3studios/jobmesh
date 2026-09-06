// FILE: src/app/(seeker)/progress/page.tsx
// /progress retired: its widgets (goal ring, streak, 7-day chart, funnel,
// pipeline) are the second half of /today now. Old links and bookmarks land
// on the pipeline section.
import { redirect } from 'next/navigation';

export default function ProgressRedirect() {
  redirect('/today#pipeline');
}
