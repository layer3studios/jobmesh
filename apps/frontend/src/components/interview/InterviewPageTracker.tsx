'use client';
// FILE: src/components/interview/InterviewPageTracker.tsx
// Invisible tracker for the public booking page, matching ApplySuccessTracker:
// fires once on mount, routes through trackEvent (a no-op until the visitor has
// granted analytics consent). Properties are enums only — never the booking
// token, the candidate's name, or a company id.
import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics-events';

export default function InterviewPageTracker({ status, mode }: { status: string; mode?: string }) {
  useEffect(() => {
    trackEvent('interview_booking_page_viewed', { status, mode });
  }, [status, mode]);
  return null;
}
