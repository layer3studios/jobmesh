'use client';

import { useSeeker } from '../../../context/seeker/SeekerContext';
import LoginScreen from '../../../components/seeker/LoginScreen';
import ResumeUpload from '../../../components/seeker/resume/ResumeUpload';

export default function Page() {
  const { currentUser } = useSeeker();
  if (!currentUser) return <LoginScreen />;
  return <ResumeUpload />;
}
