'use client';
// FILE: settings/personal/AvatarSection.tsx
// Profile photo: the current image, upload, remove.
//
// The preview is the SAME <Avatar> the top nav and note authors render, so what you
// see here is literally what teammates see — not a mockup at a different size with
// different fallback rules.
//
// Removing an upload does not leave a blank: Google's photo comes back if there is
// one, initials if there is not. So "Remove" is only offered when there is an upload
// to remove; clearing a Google photo is not something this app can do.

import { useRef, useState } from 'react';
import { Avatar, Button, useToast } from '@/components/ui';
import { uploadAvatar, removeAvatar } from '@/api/employer-me-api';
import { EmployerApiError } from '@/api/employer-api';
import { displayPictureFor, type EmployerUser } from '@/context/employer/employer-context-types';
import { COPY } from '@/theme/brand';

const C = COPY.employer.personal;
const ACCEPTED_TYPES = 'image/png,image/jpeg,image/webp';
const MAXIMUM_AVATAR_BYTES = 2 * 1024 * 1024;

/** "2.4 MB" — only used to tell the user how far over the limit they are. */
function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AvatarSection({
  user, onChanged,
}: {
  user: EmployerUser;
  onChanged: () => Promise<void> | void;
}) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBusy = isUploading || isRemoving;

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Always clear the input: picking the SAME file twice fires no change event
    // otherwise, so a failed upload could not be retried.
    event.target.value = '';
    if (!file) return;

    setError(null);
    // Checked here as well as on the server so an oversized file is rejected
    // instantly instead of after a pointless 2MB+ round trip.
    if (file.size > MAXIMUM_AVATAR_BYTES) {
      setError(C.photoTooLarge.replace('{size}', formatBytes(file.size)));
      return;
    }

    setIsUploading(true);
    try {
      await uploadAvatar(file);
      await onChanged();
      showToast('success', C.photoUpdated);
    } catch (err) {
      setError(err instanceof EmployerApiError ? err.message : C.photoFailed);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemove() {
    setError(null);
    setIsRemoving(true);
    try {
      await removeAvatar();
      await onChanged();
      showToast('success', C.photoRemoved);
    } catch (err) {
      setError(err instanceof EmployerApiError ? err.message : C.photoFailed);
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <section>
      <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{C.photo}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <Avatar src={displayPictureFor(user) ?? undefined} name={user.name} size="lg" />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleFileSelected}
            style={{ display: 'none' }}
            data-testid="personal-avatar-input"
          />
          <Button size="sm" loading={isUploading} disabled={isBusy} onClick={() => fileInputRef.current?.click()}>
            {user.avatarUrl ? C.replace : C.upload}
          </Button>
          {/* Only when there is an upload to remove — see the file header. */}
          {user.avatarUrl && (
            <Button size="sm" variant="secondary" loading={isRemoving} disabled={isBusy} onClick={() => void handleRemove()}>
              {C.remove}
            </Button>
          )}
        </div>
      </div>
      <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--ink-faint)' }}>{C.photoHint}</p>
      {error && (
        <p role="alert" style={{ margin: '6px 0 0', fontSize: 12, fontWeight: 500, color: 'var(--danger)' }}>
          {error}
        </p>
      )}
    </section>
  );
}
