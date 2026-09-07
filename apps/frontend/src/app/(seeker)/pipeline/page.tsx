'use client';
import { useSeeker } from '../../../context/seeker/SeekerContext';
import LoginScreen from '../../../components/seeker/LoginScreen';
import Pipeline from '../../../components/seeker/pipeline/Pipeline';

export default function Page() {
  const { currentUser } = useSeeker();
  if (!currentUser) return <LoginScreen />;
  return <Pipeline />;
}
