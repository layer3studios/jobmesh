'use client';
// FILE: settings/branding/BrandingClient.tsx
// Branding: upload/remove the company logo, and a live preview of how the company
// reads on the public careers and apply pages. The preview renders the SAME
// CompanyLogoMark the public page does, so what an employer sees here is what
// candidates get — not a mockup.

import { useRef, useState } from 'react';
import { useEmployer } from '@/context/employer/EmployerContext';
import { Button, useToast } from '@/components/ui';
import CompanyLogoMark from '@/components/company/CompanyLogoMark';
import { uploadCompanyLogo, updateEmployerCompany, EmployerApiError } from '@/api/employer-api';
import { canEditCompanySettings } from '@/lib/team-permissions';
import Breadcrumbs from '@/components/employer/Breadcrumbs';
import SettingsPageHeader from '../parts/SettingsPageHeader';
import { COPY } from '@/theme/brand';
import CareersPageLink from '../parts/CareersPageLink';

const ACCEPTED_TYPES = 'image/png,image/jpeg,image/webp';
const MAXIMUM_LOGO_BYTES = 2 * 1024 * 1024;
const CONSTRAINTS_TEXT = 'PNG, JPG, or WebP. Max 2 MB. Square recommended.';

/** "2.4 MB" — used only to tell the employer how far over the limit they are. */
function formatBytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BrandingClient() {
  const { company, viewerRole, refreshEmployerSession } = useEmployer();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const canEdit = viewerRole ? canEditCompanySettings(viewerRole) : false;
  const isBusy = isUploading || isRemoving;

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Always clear the input value: picking the SAME file twice in a row fires no
    // change event otherwise, so a failed upload could not be retried.
    event.target.value = '';
    if (!file) return;

    setUploadError(null);
    // Checked here as well as on the server so an oversized file is rejected
    // instantly instead of after a pointless 2MB+ round trip.
    if (file.size > MAXIMUM_LOGO_BYTES) {
      setUploadError(`That file is ${formatBytes(file.size)}. The limit is 2 MB.`);
      return;
    }

    setIsUploading(true);
    try {
      await uploadCompanyLogo(file);
      // Re-read the session so the new logo appears everywhere at once, not just here.
      await refreshEmployerSession();
      showToast('success', 'Logo updated.');
    } catch (error) {
      setUploadError(
        error instanceof EmployerApiError
          ? error.message
          : 'Could not upload the logo. Check your connection and try again.',
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemove() {
    setUploadError(null);
    setIsRemoving(true);
    try {
      await updateEmployerCompany({ logoUrl: null });
      await refreshEmployerSession();
      showToast('success', 'Logo removed.');
    } catch (error) {
      setUploadError(
        error instanceof EmployerApiError ? error.message : 'Could not remove the logo.',
      );
    } finally {
      setIsRemoving(false);
    }
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: COPY.employer.settings.title }, { label: COPY.employer.settings.branding }]} />
      <SettingsPageHeader title={COPY.employer.settings.branding} subtitle={COPY.employer.settings.brandingSubtitle} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>
        <div>
          <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
            Company logo
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <CompanyLogoMark
              name={company?.name}
              logoUrl={company?.logoUrl}
              size={64}
              testId="branding-logo"
            />
            {canEdit && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES}
                  onChange={handleFileSelected}
                  style={{ display: 'none' }}
                  data-testid="branding-logo-input"
                />
                <Button
                  size="sm"
                  loading={isUploading}
                  disabled={isBusy}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {company?.logoUrl ? 'Replace logo' : 'Upload logo'}
                </Button>
                {company?.logoUrl && (
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={isRemoving}
                    disabled={isBusy}
                    onClick={handleRemove}
                  >
                    Remove logo
                  </Button>
                )}
              </div>
            )}
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--ink-faint)' }}>
            {canEdit ? CONSTRAINTS_TEXT : 'Only a Founder or Owner can change the logo.'}
          </p>
          {uploadError && (
            <p role="alert" style={{ margin: '6px 0 0', fontSize: 12, fontWeight: 500, color: 'var(--danger)' }}>
              {uploadError}
            </p>
          )}
        </div>

        <div>
          <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
            Careers page preview
          </p>
          <div style={{
            background: 'var(--surface-raised)', border: '0.5px solid var(--border)',
            borderRadius: 12, padding: 20, display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <CompanyLogoMark name={company?.name} logoUrl={company?.logoUrl} size={48} testId="branding-initials" />
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--ink)' }}>
                {company?.name ?? 'Your company'}
              </p>
              {company?.tagline && (
                <p style={{ margin: '2px 0 0', fontSize: 14, color: 'var(--ink-muted)' }}>
                  {company.tagline}
                </p>
              )}
              <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--ink-2)' }}>Open roles</p>
            </div>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--ink-faint)' }}>
            Set your tagline under Settings → Company. Colors and apply page theme — coming soon.
          </p>
        </div>

        {company && (
          <CareersPageLink slug={company.slug} onCopied={() => showToast('success', 'Careers link copied.')} />
        )}
      </div>
    </div>
  );
}
