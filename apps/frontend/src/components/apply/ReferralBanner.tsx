// FILE: src/components/apply/ReferralBanner.tsx
// "Priya Shah referred you to this role." Sits above the apply form when the
// candidate arrived through a teammate's link.
//
// Deliberately quiet. This is reassurance — proof the link worked and that a real
// person is behind the application — not a call to action, so it reads as a note
// rather than an alert. It carries no dismiss control: there is nothing to act on,
// and a dismissable strip would imply there is.

import { UserRoundCheck } from 'lucide-react';
import { COPY } from '@/theme/brand';

export default function ReferralBanner({ referrerName }: { referrerName: string }) {
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '9px 12px', borderRadius: 8,
        // Accent-tinted rather than success-green: nothing has succeeded yet, the
        // candidate has only arrived. --accent-soft is the same tint the seeker
        // nav uses for "you are here" states.
        background: 'var(--accent-soft)',
        border: '0.5px solid var(--border)',
      }}
    >
      <UserRoundCheck size={15} aria-hidden="true" style={{ color: 'var(--accent)', flexShrink: 0 }} />
      <p style={{ margin: 0, fontSize: 13, color: 'var(--ink)' }}>
        {COPY.employer.referrals.referredByLabel.replace('{name}', referrerName)}
      </p>
    </div>
  );
}
