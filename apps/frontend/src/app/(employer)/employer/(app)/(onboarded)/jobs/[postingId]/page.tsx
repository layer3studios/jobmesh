'use client';
import { useParams } from 'next/navigation';
import { PostingDetail } from '@/components/employer/jobs/Detail';

export default function Page() {
  const { postingId } = useParams();
  return <PostingDetail postingId={postingId as string} />;
}
