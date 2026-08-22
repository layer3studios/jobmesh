'use client';
// FILE: src/hooks/employer/useBackOrFallback.ts
// "Go back to wherever you came from" for Cancel / Back controls. Uses the
// browser history stack so the user returns to their actual previous page
// rather than a hard-coded parent route. With no history to pop (direct URL
// access, fresh tab) it pushes the logical parent instead of stranding them.

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

export function useBackOrFallback(fallbackHref: string): () => void {
  const router = useRouter();
  return useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallbackHref);
  }, [router, fallbackHref]);
}
