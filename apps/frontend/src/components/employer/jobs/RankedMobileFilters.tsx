'use client';
// FILE: src/components/employer/jobs/RankedMobileFilters.tsx
// Below 768px the sidebar lives behind this "Filters" button (with an
// active-count badge) in a slide-over Drawer.

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Badge, Button, Drawer } from '@/components/ui';

export default function RankedMobileFilters({
  activeFilterCount, children,
}: {
  activeFilterCount: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Filters{activeFilterCount > 0 && <Badge variant="brand" style={{ marginLeft: 6 }}>{activeFilterCount}</Badge>}
      </Button>
      <Drawer isOpen={open} onClose={() => setOpen(false)} title="Filters" side="right">
        {children}
      </Drawer>
    </div>
  );
}
