// FILE: src/app/(apply)/privacy/export/page.tsx
// Where the emailed one-time data-export link lands. Public and unauthenticated by
// design — the token in the URL is the credential.
//
// In the (apply) group, not (seeker): the person arriving has no JobMesh account,
// which is the whole premise of the DPDP right of access.
import type { Metadata } from 'next';
import { Suspense } from 'react';
import DataExportRedeem from '@/components/seeker/legal/DataExportRedeem';

export const metadata: Metadata = {
  title: 'Download your data',
  // A one-time credential lives in this URL. Nothing here should ever be crawled.
  robots: { index: false, follow: false },
};

export default function DataExportPage() {
  return (
    <Suspense fallback={null}>
      <DataExportRedeem />
    </Suspense>
  );
}
