'use client';
// FILE: settings/branding/parts/CulturePhotoGrid.tsx
// Photo picker for the culture section: thumbnails, add, remove.
//
// Uploading stores the bytes immediately and returns a URL, but does NOT attach
// the photo to the company — the parent editor holds the whole section and saves
// it with one PATCH. So a photo added and then abandoned without saving leaves an
// unreferenced file on disk. That is the deliberate trade: the alternative is
// writing half the section behind the employer's back, and an orphaned image is
// cheaper than a careers page that half-changed.

import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Button, Stack } from '@/components/ui';
import { COPY } from '@/theme/brand';
import { uploadCulturePhoto } from '@/api/employer-api';
import { MAXIMUM_CULTURE_PHOTOS } from '@/context/employer/employer-context-types';

const TEXT = COPY.employer.culture;
const ACCEPTED_TYPES = 'image/png,image/jpeg,image/webp';
const MAXIMUM_PHOTO_BYTES = 5 * 1024 * 1024;

/** "6.2 MB" — used only to tell the employer how far over the limit they are. */
const formatBytes = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export default function CulturePhotoGrid({ photoUrls, disabled, onChange, onError }: {
  photoUrls: string[];
  disabled: boolean;
  onChange: (next: string[]) => void;
  onError: (message: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const isFull = photoUrls.length >= MAXIMUM_CULTURE_PHOTOS;

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Always clear the value: picking the SAME file twice fires no change event
    // otherwise, so a failed upload could not be retried.
    event.target.value = '';
    if (!file) return;

    // Checked here as well as on the server so an oversized file is rejected
    // instantly instead of after a pointless 5MB round trip.
    if (file.size > MAXIMUM_PHOTO_BYTES) {
      onError(TEXT.photoTooLarge.replace('{size}', formatBytes(file.size)));
      return;
    }

    setIsUploading(true);
    try {
      onChange([...photoUrls, await uploadCulturePhoto(file)]);
    } catch {
      onError(TEXT.photoUploadFailed);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <Stack gap={10}>
      <div>
        <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--ink-muted)' }}>
          {TEXT.photosLabel}
        </span>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ink-faint)' }}>{TEXT.photosHint}</p>
      </div>

      {photoUrls.length > 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10,
        }}>
          {photoUrls.map((url) => (
            <div key={url} style={{ position: 'relative' }}>
              {/* Same locked ratio the careers page uses, so this preview is a
                  preview rather than an approximation. */}
              {/* eslint-disable-next-line @next/next/no-img-element -- employer
                  upload of unknown dimensions, streamed from our own API. */}
              <img
                src={url}
                alt=""
                style={{
                  width: '100%', aspectRatio: '4 / 3', objectFit: 'cover',
                  borderRadius: 8, border: '0.5px solid var(--border)', display: 'block',
                  background: 'var(--surface-sunken)',
                }}
              />
              <button
                type="button"
                aria-label={TEXT.removePhoto}
                title={TEXT.removePhoto}
                disabled={disabled}
                onClick={() => onChange(photoUrls.filter((row) => row !== url))}
                style={{
                  position: 'absolute', top: 5, right: 5, width: 22, height: 22,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 999, border: '0.5px solid var(--border)',
                  background: 'var(--surface)', color: 'var(--ink)', cursor: 'pointer', padding: 0,
                }}
              >
                <X size={12} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Stack gap={8} dir="row" align="center" wrap>
        <Button
          type="button" variant="secondary" size="sm"
          disabled={disabled || isFull || isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Stack gap={6} dir="row" align="center">
            <ImagePlus size={14} aria-hidden="true" />
            {isUploading ? TEXT.saving : TEXT.addPhoto}
          </Stack>
        </Button>
        {isFull && <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{TEXT.photoLimit}</span>}
      </Stack>

      <input
        ref={fileInputRef} type="file" accept={ACCEPTED_TYPES} hidden
        onChange={(event) => void handleFileSelected(event)}
      />
    </Stack>
  );
}
