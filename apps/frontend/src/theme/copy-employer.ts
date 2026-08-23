// FILE: src/theme/copy-employer.ts
// Every string the EMPLOYER app renders. Split out of brand.ts (section 2).

import { EMPLOYER_JOBS_COPY } from './copy-employer-jobs';
import { EMPLOYER_HIRING_COPY } from './copy-employer-hiring';
import { EMPLOYER_SHELL_COPY } from './copy-employer-shell';

/**
 * Employer-audience strings, assembled from the three working-area files so every
 * existing COPY.employer.* reference keeps resolving unchanged.
 *
 * Placeholders use {name}-style tokens filled at the call site -- there is no
 * template engine here, and adding one for a handful of strings would be more
 * machinery than the problem needs.
 */
export const EMPLOYER_COPY = {
  ...EMPLOYER_SHELL_COPY,
  ...EMPLOYER_JOBS_COPY,
  ...EMPLOYER_HIRING_COPY,
} as const;
