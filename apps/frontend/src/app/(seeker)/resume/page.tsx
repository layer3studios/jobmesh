// FILE: src/app/(seeker)/resume/page.tsx
// /resume retired as a page: the resume is uploaded from the profile, where
// the result lands. Old links open the profile with the upload sheet already
// open.
import { redirect } from 'next/navigation';

export default function ResumeRedirect() {
  redirect('/profile?upload=1');
}
