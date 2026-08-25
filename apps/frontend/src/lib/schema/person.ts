// JSON-LD Person builder for the shareable public profile. Pure function → plain
// object, same contract as the Organization builder next to it.
//
// It describes ONLY what the page already renders. sameAs lists the LeetCode and
// GitHub accounts because those are public profiles the candidate chose to link;
// email and phone are never emitted, even when the owner made them visible on the
// page — structured data is machine-harvested at a different scale than a page a
// human opened, and that is the difference between "shared" and "scraped".
import { absoluteUrl } from '../site-url';
import type { PublicProfile } from '../../types/public-profile';

export function buildPersonSchema(profile: PublicProfile) {
  const sameAs: string[] = [];
  if (profile.github) sameAs.push(`https://github.com/${profile.github.username}`);
  if (profile.leetcode) sameAs.push(`https://leetcode.com/u/${profile.leetcode.username}`);
  if (profile.linkedinUrl) sameAs.push(profile.linkedinUrl);

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    url: absoluteUrl(`/u/${profile.slug}`),
    ...(profile.headline ? { jobTitle: profile.headline } : {}),
    ...(profile.summary ? { description: profile.summary } : {}),
    ...(profile.location ? { address: { '@type': 'PostalAddress', addressLocality: profile.location } } : {}),
    ...(profile.skills.length > 0 ? { knowsAbout: profile.skills } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };
}
