'use client';
// FILE: src/components/employer/jobs/ApplicantTagsCard.tsx
// Tags on one candidate: the applied pills, plus an input that autocompletes the
// company's tag library and offers to create a name that isn't in it yet.
//
// Writes are OPTIMISTIC. Tagging is a fast, repeated, low-stakes action — waiting
// on a round trip per pill makes labelling ten candidates feel like filing. A
// failed write puts the previous list back and says so.

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, Input, Stack, useToast } from '@/components/ui';
import {
  listCandidateTags, createCandidateTag, setApplicantTags,
} from '@/api/employer-tags-api';
import { EmployerApplicantsApiError } from '@/api/employer-applicants-api';
import type { CandidateTag } from '@/types/employer-applicants';
import TagPill from './TagPill';

const MAX_TAGS = 10;
const LABEL_STYLE = {
  fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em',
  textTransform: 'uppercase' as const, color: 'var(--ink-faint)',
};
const OPTION_STYLE: React.CSSProperties = {
  display: 'block', width: '100%', padding: '7px 10px', textAlign: 'left',
  background: 'transparent', border: 'none', cursor: 'pointer',
  font: 'inherit', fontSize: '0.82rem', color: 'var(--ink)',
};

export default function ApplicantTagsCard({ applicationId, initialTags, canEdit }: {
  applicationId: string;
  initialTags: string[];
  /** Interviewers see the pills but get no input — the backend refuses their writes. */
  canEdit: boolean;
}) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [library, setLibrary] = useState<CandidateTag[]>([]);
  const [draft, setDraft] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  useEffect(() => { setTags(initialTags); }, [initialTags]);

  useEffect(() => {
    if (!canEdit) return;
    let cancelled = false;
    listCandidateTags()
      .then((result) => { if (!cancelled) setLibrary(result); })
      .catch(() => { /* the input still works; only suggestions are missing */ });
    return () => { cancelled = true; };
  }, [canEdit]);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const normalized = draft.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 30);
  const suggestions = useMemo(() => library
    .filter((tag) => !tags.includes(tag.name))
    .filter((tag) => (normalized ? tag.name.includes(normalized) : true))
    .slice(0, 6), [library, tags, normalized]);
  const canCreate = normalized.length > 0
    && !library.some((tag) => tag.name === normalized)
    && !tags.includes(normalized);

  async function commit(next: string[]) {
    const previous = tags;
    setTags(next);
    setIsSaving(true);
    try {
      await setApplicantTags(applicationId, next);
    } catch (error) {
      setTags(previous);
      showToast('error', error instanceof EmployerApplicantsApiError ? error.message : 'Could not save tags.');
    } finally {
      setIsSaving(false);
    }
  }

  async function addTag(name: string, { create = false } = {}) {
    setDraft('');
    setIsOpen(false);
    if (tags.includes(name)) return;
    if (tags.length >= MAX_TAGS) {
      showToast('error', `A candidate can carry up to ${MAX_TAGS} tags.`);
      return;
    }
    if (create) {
      try {
        const tag = await createCandidateTag(name);
        setLibrary((prev) => (prev.some((item) => item.id === tag.id) ? prev : [...prev, tag]));
      } catch (error) {
        showToast('error', error instanceof EmployerApplicantsApiError ? error.message : 'Could not create that tag.');
        return;
      }
    }
    await commit([...tags, name]);
  }

  if (!canEdit && tags.length === 0) return null;

  return (
    <Card>
      <Stack gap={10}>
        <div style={LABEL_STYLE}>Tags</div>
        {tags.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {tags.map((name) => (
              <TagPill
                key={name}
                name={name}
                onRemove={canEdit && !isSaving
                  ? (removed) => void commit(tags.filter((tag) => tag !== removed))
                  : undefined}
              />
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--ink-faint)' }}>
            No tags yet. Add one to group this candidate with others.
          </p>
        )}

        {canEdit && tags.length < MAX_TAGS && (
          <div ref={containerRef} style={{ position: 'relative' }}>
            <Input
              aria-label="Add a tag"
              placeholder="Add a tag"
              value={draft}
              maxLength={30}
              onFocus={() => setIsOpen(true)}
              onChange={(event) => { setDraft(event.target.value); setIsOpen(true); }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') { setIsOpen(false); return; }
                if (event.key !== 'Enter' || !normalized) return;
                event.preventDefault();
                const match = suggestions[0];
                if (match) void addTag(match.name);
                else if (canCreate) void addTag(normalized, { create: true });
              }}
            />
            {isOpen && (suggestions.length > 0 || canCreate) && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                background: 'var(--paper)', border: '1px solid var(--border)',
                borderRadius: 8, boxShadow: 'var(--shadow-md)', overflow: 'hidden', zIndex: 5,
              }}>
                {suggestions.map((tag) => (
                  <button key={tag.id} type="button" style={OPTION_STYLE}
                    onClick={() => void addTag(tag.name)}>
                    {tag.name}
                  </button>
                ))}
                {canCreate && (
                  <button type="button" style={{ ...OPTION_STYLE, color: 'var(--accent)', fontWeight: 600 }}
                    onClick={() => void addTag(normalized, { create: true })}>
                    + Create “{normalized}”
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </Stack>
    </Card>
  );
}
