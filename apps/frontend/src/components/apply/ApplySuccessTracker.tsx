'use client';
// FILE: src/components/apply/ApplySuccessTracker.tsx
// Invisible client child mounted on the (server-rendered) apply success page. Fires
// apply_success_viewed once on mount. The server page has no job/company IDs of its
// own, so it passes what it knows (companySlug + the jobId threaded through the success
// query by ApplyFormClient). Renders nothing.
import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics-events';

export default function ApplySuccessTracker({ companySlug, jobId }: { companySlug: string; jobId?: string }) {
  useEffect(() => {
    trackEvent('apply_success_viewed', { companySlug, jobId, companyId: companySlug });
  }, [companySlug, jobId]);
  return null;
}
