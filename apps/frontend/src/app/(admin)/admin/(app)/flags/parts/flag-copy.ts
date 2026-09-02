// FILE: admin/flags/parts/flag-copy.ts
// Plain-language copy for each flag. `whenOff` states exactly what stops AND
// what keeps working — someone reaching for a kill switch during an incident
// needs to know the blast radius, not a restatement of the flag's name.

import type { FeatureFlagName } from '@/types/admin-feature-flags';

export interface FlagCopy {
  title: string;
  /** What the flag governs while it is on. */
  description: string;
  /** What turning it OFF actually does. Shown on the card and in the confirm. */
  whenOff: string;
  /** Confirm-modal title, used only when switching a flag off. */
  confirmTitle: string;
}

export const FLAG_COPY: Record<FeatureFlagName, FlagCopy> = {
  scraperCronEnabled: {
    title: 'Daily job scrape',
    description: 'The 06:00 scrape that pulls new jobs from every configured ATS.',
    whenOff: 'Pauses the daily scrape. Jobs already in the database stay live and searchable, but no new ones arrive and expired ones stop being cleaned up. A scrape started by hand still runs.',
    confirmTitle: 'Pause the daily job scrape?',
  },
  jdExtractionEnabled: {
    title: 'JD extraction',
    description: 'AI parsing of scraped job descriptions into structured requirements.',
    whenOff: 'Scraping keeps running and jobs still arrive; they just land without AI-parsed requirements. Unparsed jobs are picked up automatically once this is switched back on.',
    confirmTitle: 'Pause JD extraction?',
  },
  aiScoringEnabled: {
    title: 'Applicant scoring',
    description: 'AI scoring of applicant resumes against the posting.',
    whenOff: 'New applications are still accepted and queued for scoring, but nothing is scored until this is switched back on. No queued job is lost — the queue simply stops draining.',
    confirmTitle: 'Pause applicant scoring?',
  },
  publicApplyEnabled: {
    title: 'Public applications',
    description: 'Candidates submitting applications through public job pages.',
    whenOff: 'Candidates can still browse and read every job page, but submitting an application returns a "temporarily disabled" message. This is candidate-visible — use it only during an incident.',
    confirmTitle: 'Stop accepting applications?',
  },
};

/** Order shown on the page: least to most candidate-visible. */
export const FLAG_ORDER: FeatureFlagName[] = [
  'scraperCronEnabled',
  'jdExtractionEnabled',
  'aiScoringEnabled',
  'publicApplyEnabled',
];
