'use client';
// FILE: settings/personal/PersonalSettingsClient.tsx
// The user's own settings — photo, job title, timezone, notification preferences.
//
// TWO SAVE MODELS ON ONE PAGE, ON PURPOSE. Job title and timezone are text-shaped:
// you type, you reconsider, you press Save. Notification toggles are switch-shaped:
// a switch that does not take effect until you press something else has lied to you
// about its own state. So the fields have a Save button and the toggles save
// themselves — see NotificationSettings.
//
// Photo uploads are their own transaction too: bytes are already on the server by
// the time the button stops spinning, so a Save button would have nothing to do.

import { useEffect, useState } from 'react';
import { Button, Alert, useToast } from '@/components/ui';
import { useEmployer } from '@/context/employer/EmployerContext';
import { updatePersonalSettings } from '@/api/employer-me-api';
import { EmployerApiError } from '@/api/employer-api';
import Breadcrumbs from '@/components/employer/Breadcrumbs';
import SettingsPageHeader from '../parts/SettingsPageHeader';
import { COPY } from '@/theme/brand';
import AvatarSection from './AvatarSection';
import ProfileFields from './ProfileFields';
import NotificationSettings from './NotificationSettings';

const C = COPY.employer.personal;
const DEFAULT_TIMEZONE = 'Asia/Kolkata';

export default function PersonalSettingsClient() {
  const { employerUser, refreshEmployerSession } = useEmployer();
  const { showToast } = useToast();

  const [jobTitle, setJobTitle] = useState('');
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Re-seed whenever the session payload changes — including after our own save,
  // so the draft always reflects what the server actually stored rather than what
  // we hoped it would.
  useEffect(() => {
    if (!employerUser) return;
    setJobTitle(employerUser.jobTitle ?? '');
    setTimezone(employerUser.timezone || DEFAULT_TIMEZONE);
  }, [employerUser]);

  if (!employerUser) return null;

  const isDirty = jobTitle.trim() !== (employerUser.jobTitle ?? '')
    || timezone !== (employerUser.timezone || DEFAULT_TIMEZONE);

  async function handleSave() {
    setSaveError(null);
    setIsSaving(true);
    try {
      // An empty title is sent as null, which is how the server clears it — sending
      // '' would store an empty string that reads as "set" everywhere downstream.
      await updatePersonalSettings({ timezone, jobTitle: jobTitle.trim() || null });
      await refreshEmployerSession();
      showToast('success', C.saved);
    } catch (error) {
      setSaveError(error instanceof EmployerApiError ? error.message : C.saveFailed);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <Breadcrumbs items={[
        { label: COPY.employer.settings.title },
        { label: COPY.employer.settings.personal },
      ]} />
      <SettingsPageHeader
        title={COPY.employer.settings.personal}
        subtitle={COPY.employer.settings.personalSubtitle}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>
        <AvatarSection user={employerUser} onChanged={refreshEmployerSession} />

        <ProfileFields
          name={employerUser.name}
          email={employerUser.email}
          jobTitle={jobTitle}
          timezone={timezone}
          disabled={isSaving}
          onJobTitleChange={setJobTitle}
          onTimezoneChange={setTimezone}
        />

        {saveError && <Alert type="error">{saveError}</Alert>}
        <div>
          {/* Disabled until something changed: a Save button that is always live
              invites a pointless round trip and tells the user nothing. */}
          <Button size="sm" loading={isSaving} disabled={!isDirty} onClick={() => void handleSave()}>
            {COPY.employer.common.save}
          </Button>
        </div>

        <div style={{ borderTop: '0.5px solid var(--border)' }} />
        <NotificationSettings
          preferences={employerUser.notificationPreferences}
          onChanged={refreshEmployerSession}
        />
      </div>
    </div>
  );
}
