'use client';
import { useSeeker } from '../../../context/seeker/SeekerContext';
import LoginScreen from '../../../components/seeker/LoginScreen';
import Profile from '../../../components/seeker/profile/Profile';

export default function Page() {
  const { currentUser } = useSeeker();
  if (!currentUser) return <LoginScreen />;
  return <Profile />;
}
