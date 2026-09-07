'use client';
// FILE: src/components/seeker/profile/AvatarField.tsx
// The photo control on Basic information: the current avatar as a square tile
// with an "Upload avatar" scrim over it, the accepted formats underneath, and
// a way back to the photo Google gave us. It saves on pick rather than waiting
// for the pane's Save button, because a file chooser closing and nothing
// changing reads as a failure.
import { useRef, useState } from 'react';
import { ImageUp, Loader2, Undo2 } from 'lucide-react';
import { useSeeker } from '../../../context/seeker/SeekerContext';
import { uploadSeekerAvatar, removeSeekerAvatar, SeekerApiError } from '../../../api/seeker-api';

const MAX_BYTES = 2 * 1024 * 1024;
const ACCEPTED = 'image/png,image/jpeg,image/webp';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function AvatarField() {
  const { currentUser, setAvatar } = useSeeker();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const name = currentUser?.name ?? '';
  const src = currentUser?.picture;
  const uploaded = !!currentUser?.hasUploadedAvatar;

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (file.size > MAX_BYTES) { setError('That image is over 2 MB. Try a smaller one.'); return; }
    setBusy(true);
    try {
      const next = await uploadSeekerAvatar(file);
      setAvatar(next.picture, true);
      setFailed(false);
    } catch (err) {
      setError(err instanceof SeekerApiError ? err.message : 'Could not upload that image. Try again.');
    } finally { setBusy(false); }
  };

  const revert = async () => {
    setBusy(true); setError(null);
    try {
      const next = await removeSeekerAvatar();
      setAvatar(next.picture, false);
      setFailed(false);
    } catch (err) {
      setError(err instanceof SeekerApiError ? err.message : 'Could not remove it. Try again.');
    } finally { setBusy(false); }
  };

  return (
    <div className="pf-av">
      <div className="pf-av__stack">
        <span className="pf-av__cap">{uploaded ? 'Change avatar' : 'Upload avatar'}</span>
        <button
          type="button" className="pf-av__tile press" disabled={busy}
          onClick={() => inputRef.current?.click()}
          aria-label={uploaded ? 'Change your avatar' : 'Upload an avatar'}
        >
          {src && !failed
            ? <img className="pf-av__img" src={src} alt="" onError={() => setFailed(true)} />
            : <span className="pf-av__initials" aria-hidden>{initials(name)}</span>}
          <span className="pf-av__scrim">
            {busy ? <Loader2 size={14} className="pf-spin" aria-hidden /> : <ImageUp size={14} aria-hidden />}
            <span>{busy ? 'Uploading' : 'Choose a file'}</span>
          </span>
        </button>
        <span className="pf-field__hint">PNG, JPG or WebP up to 2 MB.</span>
      </div>

      <input
        ref={inputRef} type="file" accept={ACCEPTED} hidden
        onChange={e => { void pick(e.target.files?.[0]); e.target.value = ''; }}
      />

      <div className="pf-av__side">
        <p className="pf-field__hint">A square image looks best. It shows on your profile, in the nav and on your public page.</p>
        {uploaded && (
          <button type="button" className="pf-av__revert press" onClick={() => void revert()} disabled={busy}>
            <Undo2 size={12} aria-hidden /> Use my Google photo
          </button>
        )}
        {error && <p className="pf-av__error shake" role="alert">{error}</p>}
      </div>
    </div>
  );
}
