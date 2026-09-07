// FILE: src/context/seeker/seeker-context-types.ts
import type { AppliedJobEntry } from '../../types';

export interface AppUser {
  name: string;
  email: string;
  /** The photo to show: their upload when there is one, else the one from Google. */
  picture: string;
  /** True when `picture` is their own upload rather than Google's. */
  hasUploadedAvatar?: boolean;
  slug: string;
}

export interface UserCtx {
  currentUser: AppUser | null;
  isLoading: boolean;
  isUserDataLoading: boolean;
  userSkills: string[];
  appliedJobs: AppliedJobEntry[];
  appliedCount: number;
  appliedJobIds: Set<string>;
  dismissedJobIds: Set<string>;
  previousVisitAt: string | null;
  todayCount: number;
  streak: number;
  dailyGoal: number;
  skillsEditorOpen: boolean;
  openSkillsEditor: () => void;
  closeSkillsEditor: () => void;
  saveSkills: (skills: string[]) => Promise<void>;
  saveDailyGoal: (goal: number) => Promise<void>;
  /** Swap the photo everywhere after an upload or a revert. */
  setAvatar: (picture: string | null, uploaded: boolean) => void;
  toggleApplied: (jobId: string) => Promise<void>;
  toggleDismissed: (jobId: string) => Promise<void>;
  logout: () => void;
  login: (credential: string) => Promise<void>;
  updateStage: (jobId: string, stage: string) => Promise<void>;
}
