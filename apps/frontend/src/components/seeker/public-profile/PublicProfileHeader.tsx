'use client';
// FILE: src/components/seeker/public-profile/PublicProfileHeader.tsx
// Name, headline, availability, and the four things a visitor can do.
//
// THE ACTION ROW IS THE POINT OF THE PAGE. Everything below it is evidence; this
// is where a recruiter decides to act. So it offers exactly one way to reach the
// candidate — the address if they published it, the relayed form if they did not —
// rather than showing both and making the visitor choose.

import { useState } from 'react';
import { MapPin, Mail, FileText, Link2, MessageSquare } from 'lucide-react';
import type { PublicProfile } from '@/types/public-profile';
import { useToast } from '@/components/ui';
import { copyToClipboard } from '@/lib/clipboard';
import { apiUrl } from '@/lib/api-base';
import ContactModal from './ContactModal';

export default function PublicProfileHeader({ profile, shareUrl }: {
  profile: PublicProfile;
  shareUrl: string;
}) {
  const { showToast } = useToast();
  const [contactOpen, setContactOpen] = useState(false);

  const share = async () => {
    const copied = await copyToClipboard(shareUrl);
    showToast(copied ? 'success' : 'error', copied ? 'Link copied' : 'Could not copy the link');
  };

  // resumeUrl is backend-relative and already signed; apiUrl attaches the API
  // origin, which is a different host from this page in production.
  const resumeHref = profile.resumeUrl
    ? apiUrl(profile.resumeUrl.replace(/^\/api/, ''))
    : null;

  return (
    <header className="pp-header">
      {/* data-ph-mask: a real person's name and contact details — masked in replay. */}
      <div data-ph-mask>
        <h1 className="pp-name">{profile.name}</h1>
        {profile.headline && <p className="pp-headline">{profile.headline}</p>}
      </div>

      {(profile.openToWork || profile.location) && (
        <div className="pp-meta-row">
          {profile.openToWork && (
            <span className="pp-badge">
              <span className="pp-badge-dot" aria-hidden />
              Open to opportunities
            </span>
          )}
          {profile.location && (
            <span className="pp-meta-item">
              <MapPin size={13} aria-hidden />
              {profile.location}
            </span>
          )}
        </div>
      )}

      {profile.summary && <p className="pp-summary" data-ph-mask>{profile.summary}</p>}

      <div className="pp-actions">
        {resumeHref && (
          <a className="pp-action" href={resumeHref} target="_blank" rel="noopener noreferrer">
            <FileText size={15} aria-hidden />
            View resume
          </a>
        )}

        {profile.contact.showEmail && profile.contact.email ? (
          <a className="pp-action pp-action--primary" href={`mailto:${profile.contact.email}`}>
            <Mail size={15} aria-hidden />
            Email
          </a>
        ) : (
          <button type="button" className="pp-action pp-action--primary" onClick={() => setContactOpen(true)}>
            <MessageSquare size={15} aria-hidden />
            Contact via JobMesh
          </button>
        )}

        {profile.contact.showPhone && profile.contact.phone && (
          <a className="pp-action" href={`tel:${profile.contact.phone}`}>
            {profile.contact.phone}
          </a>
        )}

        <button type="button" className="pp-action" onClick={() => void share()}>
          <Link2 size={15} aria-hidden />
          Share
        </button>
      </div>

      <ContactModal
        slug={profile.slug}
        name={profile.name}
        open={contactOpen}
        onClose={() => setContactOpen(false)}
      />
    </header>
  );
}
