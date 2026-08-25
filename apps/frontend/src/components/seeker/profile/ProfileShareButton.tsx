'use client';
// FILE: src/components/seeker/profile/ProfileShareButton.tsx
// "Share profile" in the profile page header — the shortest path from having a
// public profile to actually sending it to someone.
//
// IT RENDERS NOTHING UNTIL THERE IS A LINK. A share button that opens a settings
// dialog is a button that lies about what it does; if the profile is off, the
// settings card below is where that conversation belongs, and the header stays
// clean. It fetches its own state (one cheap GET) rather than threading settings
// through the page, so Profile.tsx keeps knowing nothing about this feature.

import { useEffect, useState } from 'react';
import { Share2 } from 'lucide-react';
import { Button, useToast } from '../../ui';
import { fetchProfileSettings } from '../../../api/public-profile-api';
import { copyToClipboard } from '../../../lib/clipboard';

export default function ProfileShareButton() {
  const { showToast } = useToast();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchProfileSettings()
      .then((state) => setUrl(state.profilePublic ? state.profileUrl : null))
      .catch(() => setUrl(null));
  }, []);

  if (!url) return null;

  const share = async () => {
    const copied = await copyToClipboard(url);
    showToast(copied ? 'success' : 'error', copied ? 'Link copied' : 'Could not copy the link');
  };

  return (
    <Button variant="secondary" onClick={() => void share()}>
      <Share2 size={15} /> Share profile
    </Button>
  );
}
