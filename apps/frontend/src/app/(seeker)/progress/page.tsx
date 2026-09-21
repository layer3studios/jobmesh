// FILE: src/app/(seeker)/progress/page.tsx
// /progress retired: the pipeline has its own page now; the goal ring, streak
// and charts live on /today. Old links and bookmarks land on /pipeline.
import { redirect } from 'next/navigation';

export default function ProgressRedirect() {
  redirect('/pipeline');
}
