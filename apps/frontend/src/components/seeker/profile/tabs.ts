// FILE: src/components/seeker/profile/tabs.ts
// The profile's sections, in the order a recruiter reads them. Seven, not
// eleven: Hick's law says the bar has to be scannable in one look.
export type ProfileTab = 'basic' | 'experience' | 'education' | 'skills' | 'proof' | 'preferences' | 'settings';

export const PROFILE_TABS: { id: ProfileTab; label: string }[] = [
  { id: 'basic', label: 'Basic info' },
  { id: 'experience', label: 'Experience' },
  { id: 'education', label: 'Education' },
  { id: 'skills', label: 'Skills' },
  { id: 'proof', label: 'Proof of work' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'settings', label: 'Public profile' },
];

export function isProfileTab(v: string): v is ProfileTab {
  return PROFILE_TABS.some(t => t.id === v);
}
