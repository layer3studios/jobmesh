'use client';
// FILE: src/components/apply/ApplyDraftBanner.tsx
// The "you have unfinished work" prompt shown when a local draft is found.
//
// NEVER auto-fills (rule 6): silently repopulating a form someone walked away
// from — possibly on a shared machine — is hostile. This offers the choice.
//
// Split from ApplyFormClient for size (section 2).

import { Button, Stack } from '@/components/ui';

export default function ApplyDraftBanner({ onRestore, onDiscard }: {
  onRestore: () => void;
  onDiscard: () => void;
}) {
  return (
    <div
      style={{
        padding: '12px 14px', borderRadius: 10,
        background: 'var(--info-soft)', color: 'var(--ink)', fontSize: '0.85rem', lineHeight: 1.55,
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: 4 }}>You have unfinished work on this application.</p>
      <p style={{ marginBottom: 4 }}>
        We saved your links, notes and uploads on this device.
      </p>
      {/* Said explicitly, because it is guaranteed to be true: the resume is a File
          and cannot be serialized, so EVERY restored draft has an empty resume slot.
          Leaving this out means restore → submit → "resume required", and the draft
          feature reads as a lie. */}
      <p style={{ marginBottom: 10, color: 'var(--ink-muted)' }}>
        You&apos;ll need to attach your resume again — files like that can&apos;t be saved in your browser.
      </p>
      <Stack gap={8} dir="row" wrap>
        <Button type="button" size="sm" onClick={onRestore}>Resume</Button>
        <Button type="button" size="sm" variant="secondary" onClick={onDiscard}>Start over</Button>
      </Stack>
    </div>
  );
}
