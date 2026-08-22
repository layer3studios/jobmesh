'use client';
// FILE: src/hooks/employer/useDuplicateSource.ts
// Loads the posting behind ?duplicate={postingId} on the New-posting page and
// turns it into PostingForm initial values.
//
// Why a hook and not inline state: PostingForm seeds its field state ONCE, in a
// useState initializer, so initialValues arriving a tick later would be ignored.
// The page therefore has to withhold the form until this resolves, and that
// three-state load ('idle' | 'loading' | 'ready') is what the hook exists to own.

import { useEffect, useState } from 'react';
import { getEmployerPosting } from '@/api/employer-jobs-api';
import type { PostingCreateInput } from '@/types/employer-jobs';

export interface DuplicateSource {
  /** True while the source posting is being fetched — hold the form back. */
  isLoading: boolean;
  /** Pre-filled fields, or null when this is an ordinary new posting. */
  initialValues: Partial<PostingCreateInput> | null;
  /** Title of the posting copied from, for the info banner. */
  sourceTitle: string | null;
  /** Set when the source could not be read; the page renders an empty form. */
  error: string | null;
}

const COPY_SUFFIX = ' (copy)';

export function useDuplicateSource(postingId: string | null): DuplicateSource {
  const [state, setState] = useState<DuplicateSource>({
    isLoading: postingId != null, initialValues: null, sourceTitle: null, error: null,
  });

  useEffect(() => {
    if (!postingId) {
      setState({ isLoading: false, initialValues: null, sourceTitle: null, error: null });
      return;
    }
    // Guards against a resolved fetch writing state after the id changed or the
    // page unmounted.
    let active = true;
    setState({ isLoading: true, initialValues: null, sourceTitle: null, error: null });

    getEmployerPosting(postingId)
      .then((posting) => {
        if (!active) return;
        setState({
          isLoading: false,
          sourceTitle: posting.title,
          error: null,
          // slug, status and id are deliberately NOT copied: this is a brand-new
          // draft, not a second row pointing at the original's public URL.
          initialValues: {
            title: `${posting.title}${COPY_SUFFIX}`,
            description: posting.description,
            location: posting.location,
            workplaceType: posting.workplaceType,
            employmentType: posting.employmentType,
            salaryMin: posting.salaryMin,
            salaryMax: posting.salaryMax,
          },
        });
      })
      .catch(() => {
        if (!active) return;
        // The source was deleted or is not visible between clicking Duplicate and
        // this page loading. An empty form beats a dead end — the employer can
        // still write the posting they came here to write.
        setState({
          isLoading: false,
          initialValues: null,
          sourceTitle: null,
          error: 'Could not load the posting you duplicated. Starting from an empty form.',
        });
      });

    return () => { active = false; };
  }, [postingId]);

  return state;
}
