'use client';
// FILE: src/components/admin/EmployerAccess.tsx
// Admin page for the employer signup gate. Owns all state and API calls;
// EmployerAccessParts renders the cards. No optimistic UI (R3): mutate →
// refetch → toast. Destructive actions (toggle both ways, remove) confirm
// through a Modal first (R1, R2).

import { useState, useEffect, useCallback } from 'react';
import { ShieldX } from 'lucide-react';
import { PageHeader, Stack, Card, SkeletonCard, EmptyState, Alert, Button, Modal, useToast } from '@/components/ui';
import { SignupToggleCard, WhitelistSection } from '@/components/admin/EmployerAccessParts';
import {
  fetchEmployerAccess, setEmployerSignupOpen, addWhitelistEntry, removeWhitelistEntry,
  AdminApiError, type EmployerAccessState,
} from '@/api/admin-api';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type LoadState = 'idle' | 'loading' | 'loaded' | 'forbidden' | 'error';
const messageOf = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

export default function AdminEmployerAccess() {
  const { showToast } = useToast();
  const [access, setAccess] = useState<EmployerAccessState | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [pendingToggle, setPendingToggle] = useState<boolean | null>(null);
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);
  const [addEmail, setAddEmail] = useState('');
  const [addNote, setAddNote] = useState('');
  const [addEmailError, setAddEmailError] = useState<string | undefined>();
  const [isAdding, setIsAdding] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const load = useCallback(async () => {
    setLoadState('loading');
    try {
      setAccess(await fetchEmployerAccess());
      setLoadState('loaded');
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 403) { setLoadState('forbidden'); return; }
      setLoadState('error');
      showToast('error', messageOf(error, 'Could not load employer access'));
    }
  }, [showToast]);

  useEffect(() => { void load(); }, [load]);

  const handleAdd = async () => {
    const email = addEmail.trim();
    if (!EMAIL_PATTERN.test(email)) { setAddEmailError('Enter a valid email address.'); return; }
    setAddEmailError(undefined);
    setIsAdding(true); setIsMutating(true);
    try {
      await addWhitelistEntry(email, addNote.trim() || undefined);
      setAddEmail(''); setAddNote('');
      await load();
      showToast('success', `Added ${email}`);
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 400) setAddEmailError(error.message);
      else showToast('error', messageOf(error, 'Could not add email'));
    } finally { setIsAdding(false); setIsMutating(false); }
  };

  const handleConfirmToggle = async () => {
    if (pendingToggle === null) return;
    const next = pendingToggle;
    setIsMutating(true);
    try {
      await setEmployerSignupOpen(next);
      await load();
      showToast('success', next ? 'Employer signup opened' : 'Employer signup closed');
      setPendingToggle(null);
    } catch (error) {
      showToast('error', messageOf(error, 'Could not update the signup toggle'));
    } finally { setIsMutating(false); }
  };

  const handleConfirmRemove = async () => {
    if (!pendingRemove) return;
    const email = pendingRemove;
    setIsMutating(true);
    try {
      await removeWhitelistEntry(email);
      await load();
      showToast('success', `Removed ${email}`);
      setPendingRemove(null);
    } catch (error) {
      showToast('error', messageOf(error, 'Could not remove the email'));
    } finally { setIsMutating(false); }
  };

  return (
    // Width matches the admin analytics container + AdminTopNav (max-w-[1536px]).
    <div className="mx-auto w-full max-w-[1536px]" style={{ padding: '24px clamp(16px, 3vw, 32px) 60px' }}>
      <PageHeader label="ADMIN" title="Employer Access" />

      {(loadState === 'idle' || loadState === 'loading') && (
        <Stack gap={24}><SkeletonCard /><SkeletonCard /></Stack>
      )}

      {loadState === 'forbidden' && (
        <EmptyState
          icon={<ShieldX size={40} />}
          title="Access denied"
          body="You need an admin account to view this page."
          action={<Button as="a" href="/" variant="ghost">Back to home</Button>}
        />
      )}

      {loadState === 'error' && (
        <Card variant="raised">
          <Stack gap={16}>
            <Alert type="error">Could not load employer access — please retry.</Alert>
            <div><Button variant="ghost" onClick={() => void load()}>Retry</Button></div>
          </Stack>
        </Card>
      )}

      {loadState === 'loaded' && access && (
        <Stack gap={24}>
          <SignupToggleCard
            isOpen={access.isEmployerSignupOpen}
            isMutating={isMutating}
            onRequestToggle={setPendingToggle}
          />
          <WhitelistSection
            whitelist={access.whitelist}
            addEmail={addEmail} addNote={addNote} addEmailError={addEmailError}
            isAdding={isAdding} isMutating={isMutating}
            onAddEmailChange={(value) => { setAddEmail(value); setAddEmailError(undefined); }}
            onAddNoteChange={setAddNote}
            onAdd={handleAdd}
            onRequestRemove={setPendingRemove}
          />
        </Stack>
      )}

      <Modal
        isOpen={pendingToggle !== null}
        onClose={() => setPendingToggle(null)}
        title={pendingToggle ? 'Open employer signup to everyone?' : 'Close employer signup?'}
        footer={(
          <>
            <Button variant="ghost" onClick={() => setPendingToggle(null)}>Cancel</Button>
            <Button variant="danger" disabled={isMutating} onClick={handleConfirmToggle}>
              {pendingToggle ? 'Open signup' : 'Close signup'}
            </Button>
          </>
        )}
      >
        {pendingToggle
          ? 'Anyone with a Google account will be able to create an employer account on JobMesh. Are you sure you want to open the gate?'
          : 'Only whitelisted emails will be able to sign up. New employers will be blocked at the door until you re-open or whitelist them.'}
      </Modal>

      <Modal
        isOpen={pendingRemove !== null}
        onClose={() => setPendingRemove(null)}
        title="Remove from whitelist?"
        footer={(
          <>
            <Button variant="ghost" onClick={() => setPendingRemove(null)}>Cancel</Button>
            <Button variant="danger" disabled={isMutating} onClick={handleConfirmRemove}>
              {`Remove ${pendingRemove ?? ''}`}
            </Button>
          </>
        )}
      >
        <span><strong>{pendingRemove}</strong> will no longer be able to sign up while the global toggle is
        closed. This does not delete any existing employer account they already have.</span>
      </Modal>
    </div>
  );
}
