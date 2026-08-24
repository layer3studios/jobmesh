'use client';
// FILE: src/components/apply/useApplyLinks.ts
// The assignment submission links: the rows themselves, their per-row errors and
// the add/remove/blur handlers.
//
// Inert for a plain posting — nothing here is rendered or read when there is no
// assignment (rule 1).
//
// Split from ApplyFormClient for size (section 2).

import { useCallback, useMemo, useState } from 'react';
import { validateSubmissionLink, MAX_SUBMISSION_LINKS } from './assignment-validation';

export function useApplyLinks({ onLinksSettled, onClearLinkError }: {
  /** Commit settled rows to the progress snapshot — never mid-URL. */
  onLinksSettled: (rows: string[]) => void;
  onClearLinkError: () => void;
}) {
  const [links, setLinks] = useState<string[]>(['']);
  const [linkErrors, setLinkErrors] = useState<Array<string | null>>([null]);

  const onLinkChange = useCallback((index: number, value: string) => {
    setLinks((rows) => rows.map((row, i) => (i === index ? value : row)));
    setLinkErrors((rows) => rows.map((row, i) => (i === index ? null : row)));
    onClearLinkError();
  }, [onClearLinkError]);

  const onLinkBlur = useCallback((index: number) => {
    setLinks((rows) => {
      setLinkErrors((errs) => errs.map((err, i) => (i === index ? validateSubmissionLink(rows[i] ?? '') : err)));
      onLinksSettled(rows);
      return rows;
    });
  }, [onLinksSettled]);

  const onAddLink = useCallback(() => {
    setLinks((rows) => (rows.length >= MAX_SUBMISSION_LINKS ? rows : [...rows, '']));
    setLinkErrors((rows) => (rows.length >= MAX_SUBMISSION_LINKS ? rows : [...rows, null]));
  }, []);

  const onRemoveLink = useCallback((index: number) => {
    setLinks((rows) => {
      const next = rows.length <= 1 ? [''] : rows.filter((_, i) => i !== index);
      onLinksSettled(next);
      return next;
    });
    setLinkErrors((rows) => (rows.length <= 1 ? [null] : rows.filter((_, i) => i !== index)));
  }, [onLinksSettled]);

  const validLinks = useMemo(
    () => links.map((link) => link.trim()).filter((link) => link !== '' && validateSubmissionLink(link) === null),
    [links],
  );

  return {
    links, setLinks, linkErrors, setLinkErrors, validLinks,
    onLinkChange, onLinkBlur, onAddLink, onRemoveLink,
  };
}

export default useApplyLinks;
