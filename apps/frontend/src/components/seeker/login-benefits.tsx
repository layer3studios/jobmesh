// FILE: src/components/seeker/login-benefits.tsx
import { Sparkles, Bookmark, Target, BarChart3 } from 'lucide-react';
import type { ReactNode } from 'react';

export const LOGIN_BENEFITS: { icon: ReactNode; label: string }[] = [
  { icon: <Target size={14} />, label: 'Track every application in one place' },
  { icon: <Sparkles size={14} />, label: 'See which roles match your skills' },
  { icon: <BarChart3 size={14} />, label: 'Daily streaks and progress tracking' },
  { icon: <Bookmark size={14} />, label: 'Bookmark roles to come back later' },
];
