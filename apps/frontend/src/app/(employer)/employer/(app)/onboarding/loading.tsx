// FILE: /employer/onboarding loading — onboarding form skeleton.
import { SkeletonLine } from '../../../../../components/ui/Skeleton';

export default function OnboardingLoading() {
  return (
    <div className="container-md" style={{ padding: '40px 16px' }}>
      <SkeletonLine width="50%" height={30} style={{ marginBottom: 10 }} />
      <SkeletonLine width="70%" height={14} style={{ marginBottom: 28 }} />
      <div style={{ display: 'grid', gap: 16 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i}>
            <SkeletonLine width="30%" height={13} style={{ marginBottom: 6 }} />
            <SkeletonLine height={40} style={{ borderRadius: 8 }} />
          </div>
        ))}
        <SkeletonLine width="160px" height={44} style={{ borderRadius: 10 }} />
      </div>
    </div>
  );
}
