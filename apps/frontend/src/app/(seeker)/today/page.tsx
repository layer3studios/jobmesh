'use client';

import { useSeeker } from '../../../context/seeker/SeekerContext';
import LoginScreen from '../../../components/seeker/LoginScreen';
import Today from '../../../components/seeker/today';

export default function Page() {
  const { currentUser } = useSeeker();
  if (!currentUser) return <LoginScreen />;
  return <Today />;
}
