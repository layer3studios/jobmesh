'use client';
import { useSeeker } from '../../../context/seeker/SeekerContext';
import LoginScreen from '../../../components/seeker/LoginScreen';
import Progress from '../../../components/seeker/progress/Progress';

export default function Page() {
  const { currentUser } = useSeeker();
  if (!currentUser) return <LoginScreen />;
  return <Progress />;
}
