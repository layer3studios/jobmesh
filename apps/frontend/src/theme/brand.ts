// FILE: src/theme/brand.ts
// Single source of truth for brand + UI copy. All shipped strings live here.

import { SEEKER_COPY } from './copy-seeker';
import { EMPLOYER_COPY } from './copy-employer';

const BRAND = {
  appName: 'JobMesh',
  tagline: 'Tech jobs in India — without the fluff',
  fullName: 'JobMesh',
  description: 'Fresh tech jobs from top Indian companies, updated daily. Direct apply links, no middlemen.',
  twitter: '',
  contact: '/legal',
} as const;

const BRAND_SPLIT = { first: 'Job', accent: 'Mesh' } as const;

const SKETCH_FONT = "'Source Serif 4', 'Iowan Old Style', Georgia, ui-serif, serif";

const PALETTE = {
  primary: '#2D6A4F',
  primarySoft: 'rgba(45,106,79,0.10)',
  success: '#0F7B5A',
  danger: '#C5380F',
  warning: '#B66B0A',
  info: '#0A6CC7',
} as const;

// COPY is assembled from the two audience files, so every existing reference —
// COPY.home.heroTitle, COPY.employer.jobs.pageTitle — keeps resolving unchanged.
const COPY = {
  ...SEEKER_COPY,
  employer: EMPLOYER_COPY,
} as const;

export { BRAND, BRAND_SPLIT, SKETCH_FONT, PALETTE, COPY };

export default { BRAND, BRAND_SPLIT, SKETCH_FONT, PALETTE, COPY };
