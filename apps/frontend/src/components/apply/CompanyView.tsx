// FILE: src/components/apply/CompanyView.tsx
// Public mini careers page body (/apply/:companySlug). Composes the brand masthead
// with the filtered roles list. No auth, no seeker/employer context (C9).
//
// No longer a client component: the header is static, and only the roles list needs
// state, so 'use client' now sits on CareersJobList alone. The masthead — logo,
// name, tagline, about, links — ships as server HTML.

import { Container, Stack } from '@/components/ui';
import CompanyBrandHeader from './CompanyBrandHeader';
import CareersJobList from './CareersJobList';
import RequestMyDataForm from '@/components/seeker/legal/RequestMyDataForm';
import type { PublicCompany, PublicJobSummary } from '@/types/public-apply';

interface Props {
  company: PublicCompany;
  jobs: PublicJobSummary[];
}

export default function CompanyView({ company, jobs }: Props) {
  return (
    <Container size="md" style={{ paddingTop: 40, paddingBottom: 72 }}>
      <Stack gap={28}>
        <CompanyBrandHeader company={company} />
        <CareersJobList
          jobs={jobs}
          companySlug={company.slug}
          companyName={company.name}
          socialLinks={company.socialLinks}
        />
        {/* Last on the page, after the roles: this is the DPDP right of access, and
            the person using it is not here to browse jobs — but it has to live
            somewhere a candidate with no account can actually reach. */}
        <RequestMyDataForm companySlug={company.slug} />
      </Stack>
    </Container>
  );
}
