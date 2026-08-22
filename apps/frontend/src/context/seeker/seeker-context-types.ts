// FILE: src/context/seeker/seeker-context-types.ts
import type { AppliedJobEntry } from '../../types';

export interface AppUser {
  name: string;
  email: string;
  picture: string;
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
  toggleApplied: (jobId: string) => Promise<void>;
  toggleDismissed: (jobId: string) => Promise<void>;
  logout: () => void;
  login: (credential: string) => Promise<void>;
  updateStage: (jobId: string, stage: string) => Promise<void>;
}
