// FILE: src/app/(seeker)/directory/page.tsx
// Company directory — Server Component, public + indexable (confirmed public in the
// audit's open question). Server-fetches the directory for the ItemList JSON-LD +
// metadata, then hands off to the client <CompanyDirectory /> (verbatim Vite port)
// for search / sort / pagination. The client uses useSearchParams, so it is wrapped
// in Suspense (Next 15 requirement).
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { JsonLd } from '../../../components/schema/JsonLd';
import { buildItemListSchema } from '../../../lib/schema';
import { getSeekerDirectoryServer } from '../../../lib/server-api/seeker';
import { slugifyCompanyName } from '../../../utils/slugify-company';
import { absoluteUrl } from '../../../lib/site-url';
import { COPY } from '../../../theme/brand';
import CompanyDirectory from '../../../components/seeker/directory/CompanyDirectory';
import type { ICompany } from '../../../types';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: COPY.directory.documentTitle,
  description: COPY.directory.subtitle,
  alternates: { canonical: absoluteUrl('/directory') },
};

export default async function DirectoryPage() {
  let companies: ICompany[] = [];
  try {
    companies = await getSeekerDirectoryServer();
  } catch {
    // empty directory on backend hiccup
  }

  const itemListSchema = buildItemListSchema(
    companies.map((company) => ({
      path: `/company/${slugifyCompanyName(company.companyName)}`,
      name: company.companyName,
    })),
  );

  return (
    <>
      <JsonLd schema={itemListSchema} />
      <Suspense fallback={null}>
        <CompanyDirectory />
      </Suspense>
    </>
  );
}
