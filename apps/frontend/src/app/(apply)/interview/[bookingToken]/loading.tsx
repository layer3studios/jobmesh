// FILE: /interview/[bookingToken] loading — header + slot-card skeleton.
import { SkeletonLine } from '../../../../components/ui/Skeleton';

export default function InterviewBookingLoading() {
  return (
    <div style={{ maxWidth: 560, width: '100%', margin: '0 auto', padding: '32px 16px' }}>
      <SkeletonLine width="30%" height={14} style={{ marginBottom: 8 }} />
      <SkeletonLine width="65%" height={24} style={{ marginBottom: 20 }} />
      <SkeletonLine width="45%" height={14} style={{ marginBottom: 24 }} />
      <div style={{ display: 'grid', gap: 10 }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonLine key={i} height={56} style={{ borderRadius: 12 }} />
        ))}
      </div>
      <SkeletonLine height={44} style={{ borderRadius: 10, marginTop: 24 }} />
    </div>
  );
}
