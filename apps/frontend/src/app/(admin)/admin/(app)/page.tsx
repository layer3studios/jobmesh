// FILE: src/app/(admin)/admin/page.tsx
// Admin index → redirect to the employer-access surface (mirrors the Vite app's
// <Navigate to="employer-access" replace>).
import { redirect } from 'next/navigation';

export default function AdminIndexPage() {
  redirect('/admin/employer-access');
}
