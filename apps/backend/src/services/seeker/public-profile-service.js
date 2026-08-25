// FILE: src/services/seeker/public-profile-service.js
// Builds the payload behind GET /api/public/profile/:slug.
//
// THE SETTINGS ARE ENFORCED HERE, NOT IN THE UI. Every hidden field is OMITTED
// from the response rather than sent with a flag telling the client to hide it —
// a candidate who turns their phone number off must not be able to find it in
// the network tab. The only flags that travel are the ones the page needs to
// decide what to OFFER (showEmail decides "Email" vs "Contact via JobMesh").
//
// NOTHING INTERNAL LEAVES. No userId, no _id, no parsedProfile fields beyond the
// ones listed below, no cache metadata beyond isStale.

import { withSettingDefaults } from '../../models/seeker/seeker-public-profile-model.js';
import { readLeetCodeProfile } from './leetcode-read-service.js';
import { readGitHubProfile } from './github-read-service.js';

/** Only the experience fields a public reader has any use for. */
function publicExperience(entry) {
  return {
    company: entry?.company ?? null,
    title: entry?.title ?? null,
    startDate: entry?.startDate ?? null,
    endDate: entry?.endDate ?? null,
    isCurrent: Boolean(entry?.isCurrent),
    responsibilities: Array.isArray(entry?.responsibilities) ? entry.responsibilities.slice(0, 8) : [],
    technologies: Array.isArray(entry?.technologies) ? entry.technologies : [],
  };
}

function publicEducation(entry) {
  return {
    institution: entry?.institution ?? null,
    degree: entry?.degree ?? null,
    field: entry?.field ?? null,
    startDate: entry?.startDate ?? null,
    endDate: entry?.endDate ?? null,
  };
}

/**
 * Fetch the two integrations the settings allow, in parallel. Both read services
 * already swallow every upstream failure and fall back to stale cache, so a
 * LeetCode outage costs this page a section, never a 500.
 */
async function loadIntegrations(user, settings) {
  const wantsLeetCode = settings.showLeetCode && Boolean(user.leetcodeUsername);
  const wantsGitHub = settings.showGitHub && Boolean(user.githubUsername);
  const [leetcode, github] = await Promise.all([
    wantsLeetCode ? readLeetCodeProfile(user._id, user.leetcodeUsername) : null,
    wantsGitHub ? readGitHubProfile(user._id, user.githubUsername) : null,
  ]);
  return { leetcode, github };
}

/**
 * Shape one published seeker doc into the public profile payload.
 *
 * @param user the doc from findPublishedProfileBySlug
 * @param resumeLink { url } | null — built by the route, which owns URL layout
 */
export async function buildPublicProfile(user, resumeLink = null) {
  const settings = withSettingDefaults(user.profileSettings);
  const parsed = user.parsedProfile ?? {};
  const { leetcode, github } = await loadIntegrations(user, settings);

  const profile = {
    slug: user.profileSlug,
    // parsedProfile's name is the one the candidate edited; the Google account
    // name is only the fallback for someone who never uploaded a resume.
    name: parsed.fullName || user.name || 'JobMesh member',
    headline: settings.headline,
    openToWork: settings.openToWork,
    location: parsed.currentLocation
      ? [parsed.currentLocation.city, parsed.currentLocation.state].filter(Boolean).join(', ') || null
      : null,
    summary: parsed.summary ?? null,
    linkedinUrl: parsed.linkedinUrl ?? null,
    skills: settings.showSkills && Array.isArray(parsed.skills)
      ? parsed.skills.map((skill) => skill?.name).filter(Boolean)
      : [],
    experience: settings.showExperience && Array.isArray(parsed.experience)
      ? parsed.experience.map(publicExperience)
      : [],
    education: settings.showExperience && Array.isArray(parsed.education)
      ? parsed.education.map(publicEducation)
      : [],
    leetcode: leetcode ? { username: user.leetcodeUsername, data: leetcode } : null,
    github: github ? { username: user.githubUsername, data: github } : null,
    // What the page may OFFER, not what it may reveal. The values themselves are
    // added below only when their flag is on.
    contact: { showEmail: settings.showEmail, showPhone: settings.showPhone },
    resumeUrl: null,
  };

  if (settings.showEmail) profile.contact.email = parsed.email || user.email || null;
  if (settings.showPhone) profile.contact.phone = parsed.phone ?? null;
  if (settings.showResume && resumeLink) profile.resumeUrl = resumeLink.url;

  return profile;
}
