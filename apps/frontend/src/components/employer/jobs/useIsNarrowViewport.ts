// FILE: src/components/employer/jobs/useIsNarrowViewport.ts
// True below 768px — drives the Ranked sidebar's collapse into a drawer.

import { useEffect, useState } from 'react';

const NARROW_VIEWPORT_QUERY = '(max-width: 767px)';

export function useIsNarrowViewport(): boolean {
  const [narrow, setNarrow] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(NARROW_VIEWPORT_QUERY).matches : false);
  useEffect(() => {
    const media = window.matchMedia(NARROW_VIEWPORT_QUERY);
    const onChange = () => setNarrow(media.matches);
    media.addEventListener?.('change', onChange);
    return () => media.removeEventListener?.('change', onChange);
  }, []);
  return narrow;
}
