'use client';
// FILE: src/components/employer/onboarding/Onboarding.tsx
// One-time company setup. Lives inside the employer auth guard but outside the
// onboarded guard. Redirects on mount when a company already exists (→ dashboard);
// while submitting it owns the transition so the company-set redirect cannot
// ping-pong with the guard (R3). On success it refreshes the session, then
// navigates to the dashboard.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthLayout from '@/components/layouts/AuthLayout';
import OnboardingForm from '@/components/employer/onboarding/OnboardingForm';
import { useEmployer } from '@/context/employer/EmployerContext';
import { createEmployerCompany, EmployerApiError } from '@/api/employer-api';
import { slugifyCompanyName } from '@/utils/slugify-company';
import { trackEvent } from '@/lib/analytics-events';

const NETWORK_MESSAGE = 'Network error. Check your connection and try again.';
const ALREADY_ONBOARDED_MESSAGE = 'This account already has a company. Redirecting…';
const NAME_ERROR = 'Company name must be 2–120 characters.';
const WEBSITE_ERROR = 'Enter a valid http(s) website URL.';
const RETENTION_ERROR = 'Retention must be a whole number between 30 and 3650 days.';
const WEBSITE_PATTERN = /^https?:\/\/.+/i;
const REDIRECT_DELAY_MILLISECONDS = 2000;

export default function EmployerOnboarding() {
  const { company, refreshEmployerSession } = useEmployer();
  const router = useRouter();

  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [retentionDays, setRetentionDays] = useState('365');
  const [nameError, setNameError] = useState<string>();
  const [websiteError, setWebsiteError] = useState<string>();
  const [retentionError, setRetentionError] = useState<string>();
  const [topError, setTopError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasOnboardedConflict, setHasOnboardedConflict] = useState(false);

  // Company-setup screen reached.
  useEffect(() => { trackEvent('onboarding_started', {}); }, []);

  // ALREADY_ONBOARDED on a stale tab: show the alert briefly, then bounce.
  useEffect(() => {
    if (!hasOnboardedConflict) return;
    const timer = setTimeout(
      () => router.replace('/employer'),
      REDIRECT_DELAY_MILLISECONDS,
    );
    return () => clearTimeout(timer);
  }, [hasOnboardedConflict, router]);

  // A company already exists and we are not mid-submit: bounce to the dashboard.
  const shouldRedirect = Boolean(company) && !isSubmitting && !hasOnboardedConflict;
  useEffect(() => {
    if (shouldRedirect) router.replace('/employer');
  }, [shouldRedirect, router]);

  function mapApiError(error: EmployerApiError) {
    if (error.code === 'INVALID_NAME') setNameError(error.message);
    else if (error.code === 'INVALID_WEBSITE') setWebsiteError(error.message);
    else if (error.code === 'INVALID_RETENTION' || error.code === 'INVALID_RETENTION_DAYS') {
      setRetentionError(error.message);
    } else if (error.code === 'ALREADY_ONBOARDED') {
      setTopError(ALREADY_ONBOARDED_MESSAGE);
      setHasOnboardedConflict(true);
    } else {
      setTopError(error.message);
    }
  }

  function validate(trimmedName: string, trimmedWebsite: string, retention: number) {
    let isValid = true;
    setNameError(undefined);
    setWebsiteError(undefined);
    setRetentionError(undefined);
    if (trimmedName.length < 2 || trimmedName.length > 120) { setNameError(NAME_ERROR); isValid = false; }
    if (trimmedWebsite && !WEBSITE_PATTERN.test(trimmedWebsite)) { setWebsiteError(WEBSITE_ERROR); isValid = false; }
    if (!Number.isInteger(retention) || retention < 30 || retention > 3650) {
      setRetentionError(RETENTION_ERROR); isValid = false;
    }
    return isValid;
  }

  async function handleSubmit() {
    const trimmedName = name.trim();
    const trimmedWebsite = website.trim();
    const retention = Number(retentionDays);
    if (!validate(trimmedName, trimmedWebsite, retention)) return;

    setTopError(null);
    setIsSubmitting(true);
    try {
      await createEmployerCompany({
        name: trimmedName,
        website: trimmedWebsite || undefined,
        retentionDays: retention,
      });
      trackEvent('onboarding_completed', {});
      await refreshEmployerSession();
      router.replace('/employer');
    } catch (error) {
      if (error instanceof EmployerApiError) mapApiError(error);
      else setTopError(NETWORK_MESSAGE);
      setIsSubmitting(false);
    }
  }

  if (shouldRedirect) return null;

  return (
    <AuthLayout>
      <OnboardingForm
        name={name}
        website={website}
        retentionDays={retentionDays}
        slugPreview={slugifyCompanyName(name)}
        nameError={nameError}
        websiteError={websiteError}
        retentionError={retentionError}
        topError={topError}
        isSubmitting={isSubmitting}
        onNameChange={setName}
        onWebsiteChange={setWebsite}
        onRetentionChange={setRetentionDays}
        onSubmit={handleSubmit}
      />
    </AuthLayout>
  );
}
