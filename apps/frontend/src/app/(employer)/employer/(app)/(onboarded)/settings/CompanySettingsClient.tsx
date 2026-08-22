'use client';
// FILE: settings/CompanySettingsClient.tsx
// Company settings: editable name (PATCH /api/employer/company, Owner+ only —
// the backend gates it too), read-only slug, the public careers link, and the
// DPDP retention note. Saving re-syncs the session so the nav/company name
// update everywhere at once.

import { useState } from 'react';
import { Button, useToast } from '@/components/ui';
import { useEmployer } from '@/context/employer/EmployerContext';
import { updateEmployerCompany, EmployerApiError } from '@/api/employer-api';
import { canEditCompanySettings } from '@/lib/team-permissions';
import Breadcrumbs from '@/components/employer/Breadcrumbs';
import SettingsPageHeader from './parts/SettingsPageHeader';
import CareersPageLink from './parts/CareersPageLink';
import CompanyProfileFields from './parts/CompanyProfileFields';
import AutoArchiveSettings from './parts/AutoArchiveSettings';
import { COPY } from '@/theme/brand';
import type { SocialLinkValues } from './parts/CompanyProfileFields';
import {
  socialUrlError, buildSocialLinksPatch, hasSocialErrors, socialLinksEqual,
} from './company-settings-helpers';

const FIELD_LABEL = { margin: '0 0 6px', fontSize: 13, fontWeight: 500, color: 'var(--ink)' } as const;
const READ_ONLY_VALUE = {
  padding: '9px 12px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 8,
  background: 'var(--paper-2)', color: 'var(--ink-2)',
} as const;

export default function CompanySettingsClient() {
  const { company, viewerRole, refreshEmployerSession } = useEmployer();
  const { showToast } = useToast();
  const canEdit = viewerRole ? canEditCompanySettings(viewerRole) : false;
  const [name, setName] = useState(company?.name ?? '');
  const [tagline, setTagline] = useState(company?.tagline ?? '');
  const [about, setAbout] = useState(company?.about ?? '');
  const [social, setSocial] = useState<SocialLinkValues>({
    linkedin: company?.socialLinks?.linkedin ?? '',
    twitter: company?.socialLinks?.twitter ?? '',
    github: company?.socialLinks?.github ?? '',
  });
  const [socialErrors, setSocialErrors] = useState<Partial<Record<keyof SocialLinkValues, string | null>>>({});
  const [isSaving, setIsSaving] = useState(false);

  const setSocialField = (key: keyof SocialLinkValues, value: string) => {
    setSocial((previous) => ({ ...previous, [key]: value }));
    setSocialErrors((previous) => ({ ...previous, [key]: null }));
  };
  // Validated on blur, not on every keystroke: an in-progress "https:/" is not an
  // error yet, and flagging it while someone types reads as the field being broken.
  const validateSocialField = (key: keyof SocialLinkValues) => {
    setSocialErrors((previous) => ({ ...previous, [key]: socialUrlError(social[key]) }));
  };

  if (!company) {
    return (
      <div>
        <SettingsPageHeader title={COPY.employer.settings.company} />
        <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-2)' }}>Loading company…</p>
      </div>
    );
  }

  const trimmedName = name.trim();
  const trimmedTagline = tagline.trim();
  // An empty tagline is null on the server, so '' and null are the same state here —
  // comparing the trimmed value against (tagline ?? '') keeps clearing it dirty.
  const trimmedAbout = about.trim();
  const nextSocial = buildSocialLinksPatch(social);
  const isNameDirty = trimmedName !== company.name && trimmedName.length > 0;
  const isTaglineDirty = trimmedTagline !== (company.tagline ?? '');
  const isAboutDirty = trimmedAbout !== (company.about ?? '');
  const isSocialDirty = !socialLinksEqual(nextSocial, company.socialLinks);
  // Blocked rather than silently dropped: saving past a bad URL would quietly
  // discard something the employer typed.
  const socialInvalid = hasSocialErrors(social);
  const isDirty = (isNameDirty || isTaglineDirty || isAboutDirty || isSocialDirty) && !socialInvalid;

  async function handleSave() {
    setIsSaving(true);
    try {
      // One PATCH for the whole profile. Empty text fields go as null so the
      // careers page has a single falsy case and never renders an empty line.
      await updateEmployerCompany({
        name: trimmedName,
        tagline: trimmedTagline === '' ? null : trimmedTagline,
        about: trimmedAbout === '' ? null : trimmedAbout,
        socialLinks: nextSocial,
      });
      await refreshEmployerSession();
      showToast('success', 'Company details updated.');
    } catch (error) {
      showToast('error', error instanceof EmployerApiError ? error.message : 'Could not save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <Breadcrumbs items={[{ label: COPY.employer.settings.title }, { label: COPY.employer.settings.company }]} />
      <SettingsPageHeader title={COPY.employer.settings.company} subtitle={COPY.employer.settings.companySubtitle} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>
        <div>
          {canEdit ? (
            <>
              <CompanyProfileFields
                name={name}
                tagline={tagline}
                about={about}
                social={social}
                socialErrors={socialErrors}
                onNameChange={setName}
                onTaglineChange={setTagline}
                onAboutChange={setAbout}
                onSocialChange={setSocialField}
                onSocialBlur={validateSocialField}
              />
              <div style={{ marginTop: 12 }}>
                <Button size="sm" disabled={!isDirty} loading={isSaving} onClick={handleSave}>
                  Save changes
                </Button>
              </div>
            </>
          ) : (
            <>
              <p style={FIELD_LABEL}>Company name</p>
              <div style={READ_ONLY_VALUE}>{company.name}</div>
              <div style={{ marginTop: 12 }}>
                <p style={FIELD_LABEL}>Tagline</p>
                <div style={READ_ONLY_VALUE}>{company.tagline ?? 'Not set'}</div>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--ink-faint)' }}>
                Only a Founder or Owner can change these.
              </p>
            </>
          )}
        </div>

        <div>
          <p style={FIELD_LABEL}>Company slug</p>
          <div style={READ_ONLY_VALUE}>{company.slug}</div>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--ink-faint)' }}>
            Used in your careers and apply URLs. Contact support to change it.
          </p>
        </div>

        <CareersPageLink slug={company.slug} onCopied={() => showToast('success', 'Careers link copied.')} />

        <AutoArchiveSettings
          value={company.autoArchiveStaleDays ?? null}
          canEdit={canEdit}
          onSaved={refreshEmployerSession}
        />

        <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 16 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-2)' }}>
            Applicant data retained for {company.retentionDays} days per DPDP compliance.
          </p>
        </div>
      </div>
    </div>
  );
}
