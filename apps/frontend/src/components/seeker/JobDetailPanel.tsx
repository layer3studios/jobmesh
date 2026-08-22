// FILE: src/components/seeker/JobDetailPanel.tsx
// Backwards-compat barrel. The implementation lives under ./JobDetailPanel/.
// Existing imports for both the default component AND the named helpers continue to work.

export { default } from './JobDetailPanel/index';
export {
  stripHtmlText, buildSkillsRegex, relTime,
  getAutoTags, roleBadgeStyle, inferWorkplace,
} from './JobDetailPanel/job-detail-helpers';
