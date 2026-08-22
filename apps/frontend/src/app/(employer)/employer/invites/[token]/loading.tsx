// FILE: invites/[token] loading — centered spinner while the preview resolves.
import { Spinner } from '@/components/ui';

export default function InviteAcceptLoading() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-sunken)' }}>
      <Spinner size={22} />
    </div>
  );
}
