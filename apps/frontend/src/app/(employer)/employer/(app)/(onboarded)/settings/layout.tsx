'use client';
// FILE: settings/layout.tsx
// Shared frame for every /employer/settings/* page: the SettingsSidebar on the
// left, the sub-page content on the right. Below 768px the sidebar collapses
// into horizontal tabs above the content.

import type { ReactNode } from 'react';
import SettingsSidebar from './SettingsSidebar';
import { useIsNarrowViewport } from '@/components/employer/jobs/useIsNarrowViewport';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const isNarrow = useIsNarrowViewport();

  if (isNarrow) {
    return (
      <div style={{ padding: '20px 16px' }}>
        <SettingsSidebar horizontal />
        <div>{children}</div>
      </div>
    );
  }
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', padding: '24px 16px', width: '100%' }}>
      <SettingsSidebar />
      <div style={{ flex: 1, minWidth: 0, paddingLeft: 24 }}>{children}</div>
    </div>
  );
}
