'use client';
// FILE: settings/layout.tsx
// Shared frame for every /employer/settings/* page: the SettingsSidebar on the
// left, the sub-page content on the right. Below 768px the sidebar collapses
// into horizontal tabs above the content.

import type { ReactNode } from 'react';
import SettingsSidebar from './SettingsSidebar';
import { PageShell } from '@/components/ui';
import { useIsNarrowViewport } from '@/components/employer/jobs/useIsNarrowViewport';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const isNarrow = useIsNarrowViewport();

  if (isNarrow) {
    return (
      <PageShell>
        <SettingsSidebar horizontal />
        <div>{children}</div>
      </PageShell>
    );
  }
  // The sidebar and the content BOTH sit inside the shell, so the page's
  // max-width applies to the combined layout rather than to the content alone —
  // otherwise the sidebar would push the content off-centre on a wide monitor.
  return (
    <PageShell style={{ display: 'flex', alignItems: 'flex-start' }}>
      <SettingsSidebar />
      <div style={{ flex: 1, minWidth: 0, paddingLeft: 24 }}>{children}</div>
    </PageShell>
  );
}
