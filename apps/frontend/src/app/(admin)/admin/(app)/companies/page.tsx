// FILE: admin/companies/page.tsx
// Company health table. Client-rendered to match the rest of the admin panel's
// data pages and to keep sorting interactive without a round trip.
import type { Metadata } from 'next';
import CompaniesClient from './CompaniesClient';

export const metadata: Metadata = {
  title: 'Companies · JobMesh Admin',
  robots: { index: false, follow: false },
};

export default function AdminCompaniesPage() {
  return <CompaniesClient />;
}
