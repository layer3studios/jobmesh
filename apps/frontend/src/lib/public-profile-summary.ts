// FILE: src/lib/public-profile-summary.ts
// The one-line description behind a shared /u/{slug} link — the text that shows
// under the title in a WhatsApp or LinkedIn preview.
//
// IT LEADS WITH EVIDENCE, NOT ADJECTIVES. "153 LeetCode problems · 30 GitHub
// repos" is checkable; "passionate engineer" is not, and the preview is roughly
// 160 characters of the only pitch a recruiter reads before deciding to tap.
// Sections the owner hid contribute nothing, so a private profile's preview never
// implies data the page will not show.

import type { PublicProfile } from '../types/public-profile';

const MAX_DESCRIPTION_LENGTH = 200;
const MAX_SKILLS = 4;

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

/** "Full Stack Engineer · React, TypeScript · 153 LeetCode problems · Open to work" */
export function buildProfileDescription(profile: PublicProfile): string {
  const parts: string[] = [];

  if (profile.headline) parts.push(profile.headline);
  if (profile.skills.length > 0) parts.push(profile.skills.slice(0, MAX_SKILLS).join(', '));
  if (profile.leetcode) {
    parts.push(`${plural(profile.leetcode.data.totalSolved, 'LeetCode problem')} solved`);
  }
  if (profile.github) {
    parts.push(plural(profile.github.data.publicRepoCount, 'GitHub repo'));
  }
  if (profile.openToWork) parts.push('Open to opportunities');

  // Nothing to say is a real state: a candidate who published a bare profile gets
  // a sentence rather than an empty description tag.
  const description = parts.length > 0
    ? parts.join(' · ')
    : `${profile.name} on JobMesh.`;

  return description.length > MAX_DESCRIPTION_LENGTH
    ? `${description.slice(0, MAX_DESCRIPTION_LENGTH - 1).trimEnd()}…`
    : description;
}

/**
 * The skills a public record actually backs up: a LeetCode top-topic or a GitHub
 * repo language matching the claim. Compared case-insensitively and on a
 * word-boundary basis, so "React" matches "react" but never "React Native"'s
 * neighbours by accident.
 */
export function verifiedSkillSet(profile: PublicProfile): Set<string> {
  const evidence = new Set<string>();
  for (const skill of profile.leetcode?.data.topSkills ?? []) evidence.add(skill.name.toLowerCase());
  for (const language of profile.leetcode?.data.languages ?? []) evidence.add(language.name.toLowerCase());
  for (const language of profile.github?.data.languages ?? []) evidence.add(language.name.toLowerCase());

  const verified = new Set<string>();
  for (const skill of profile.skills) {
    if (evidence.has(skill.toLowerCase())) verified.add(skill);
  }
  return verified;
}
