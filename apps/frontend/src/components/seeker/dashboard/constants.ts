// FILE: src/components/seeker/dashboard/constants.ts
import type { CSSProperties } from 'react';

export const ROLE_OPTIONS = [
  { value: 'all', label: 'All roles' },
  { value: 'Frontend', label: 'Frontend' },
  { value: 'Backend', label: 'Backend' },
  { value: 'Full Stack', label: 'Full Stack' },
  { value: 'DevOps/SRE', label: 'DevOps' },
  { value: 'Data', label: 'Data' },
  { value: 'Security', label: 'Security' },
  { value: 'ML/AI', label: 'ML/AI' },
  { value: 'Product', label: 'Product' },
  { value: 'Design', label: 'Design' },
  { value: 'QA', label: 'QA' },
  { value: 'Mobile', label: 'Mobile' },
];

// Multi-select bands: OR within the category. No 'all' sentinel — an empty
// selection means no experience filter.
export const EXPERIENCE_OPTIONS = [
  { value: 'Fresher (0-1y)', label: 'Fresher (0-1y)' },
  { value: 'Junior (1-3y)', label: 'Junior (1-3y)' },
  { value: 'Mid (3-5y)', label: 'Mid (3-5y)' },
  { value: 'Senior (5-8y)', label: 'Senior (5-8y)' },
  { value: 'Staff+ (8y+)', label: 'Staff+ (8y+)' },
];

export const WORKPLACE_OPTIONS = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'on-site', label: 'On-site' },
];

export const PAGE_SIZE = 30;

/** Salary filter bounds, in INR lakhs per annum. */
export const SALARY_MAX_LPA = 100;

/** Location filter allows at most this many cities at once. */
export const MAX_LOCATIONS = 5;

export const desktopSelectStyle: CSSProperties = {
  padding: '8px 28px 8px 12px',
  fontFamily: 'inherit', fontSize: '0.82rem',
  background: 'var(--surface)', color: 'var(--ink)',
  border: '1px solid var(--border-strong)', borderRadius: 9,
  cursor: 'pointer', outline: 'none', appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%236F6E69' stroke-width='2'%3E%3Cpath d='M3 5l3 3 3-3'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
};
