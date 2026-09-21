// FILE: src/components/seeker/profile/completeness.ts
// How complete a profile is, and the next thing to do about it. Ten checks,
// each worth the same; the account itself counts as the first (endowed
// progress — nobody starts at zero). The next actions are the first two
// unmet checks, named as actions, never as "fields missing".
import type { ParsedProfile } from '../../../types/seeker-profile';
import type { ProfileTab } from './tabs';

export interface Check { key: string; label: string; action: string; tab: ProfileTab; met: boolean }

export function profileChecks(p: ParsedProfile, extras: { github?: boolean; leetcode?: boolean; publicOn?: boolean }): Check[] {
  return [
    { key: 'account', label: 'Account', action: 'Signed in', tab: 'basic', met: true },
    { key: 'name', label: 'Name & contact', action: 'Add your name and email', tab: 'basic', met: !!p.fullName && !!p.email },
    { key: 'location', label: 'Location', action: 'Add your city', tab: 'basic', met: !!p.currentLocation?.city },
    { key: 'summary', label: 'About', action: 'Write two lines about yourself', tab: 'basic', met: !!p.summary && p.summary.trim().length >= 40 },
    { key: 'skills', label: 'Skills', action: `Add ${Math.max(0, 5 - p.skills.length)} more skills`, tab: 'skills', met: p.skills.length >= 5 },
    { key: 'experience', label: 'Experience', action: 'Add a role you have held', tab: 'experience', met: p.experience.length > 0 },
    { key: 'education', label: 'Education', action: 'Add where you studied', tab: 'education', met: p.education.length > 0 },
    { key: 'prefs', label: 'Preferences', action: 'Set notice period and expected pay', tab: 'preferences', met: !!p.noticePeriod && p.expectedCTC?.amount != null },
    { key: 'proof', label: 'Proof of work', action: 'Connect GitHub or LeetCode', tab: 'proof', met: !!extras.github || !!extras.leetcode },
    { key: 'public', label: 'Public link', action: 'Turn on your public profile', tab: 'settings', met: !!extras.publicOn },
  ];
}

export function completeness(checks: Check[]): { pct: number; next: Check[]; met: number } {
  const met = checks.filter(c => c.met).length;
  return { pct: Math.round((met / checks.length) * 100), met, next: checks.filter(c => !c.met).slice(0, 2) };
}
