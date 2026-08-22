'use client';
// FILE: src/components/employer/jobs/ApplicantReviewPanel.tsx
// Applicant review rail: score hero (Rescore action) → skills → fit tiles → summary →
// action bar → history footer. Move is inline; archive opens a confirm Modal with a
// separate note. Rescore requeues AI scoring (old score stays behind a chip; no polling).

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Briefcase, MapPin, Clock } from 'lucide-react';
import { Button, Select, Input, Textarea, Modal, Alert, Stack, Badge } from '@/components/ui';
import { moveApplicant, archiveApplicant, unarchiveApplicant, rescoreApplicant, EmployerApplicantsApiError } from '@/api/employer-applicants-api';
import type { ApplicantScore, Stage, ArchiveReason, StageChange, ScoreJobStatus } from '@/types/employer-applicants';
import { useEmployer } from '@/context/employer/EmployerContext';
import { canMoveApplicant, canArchiveApplicant, canRescoreApplicant } from '@/lib/team-permissions';
import { trackEvent } from '@/lib/analytics-events';
import { formatRelativeTime } from './applicant-view-helpers';
import { TIER_COLOR, SectionLabel, SkillRow, RescoreButton, FitTile } from './applicant-review-parts';
import { useApplicantReviewAnalytics } from './useApplicantReviewAnalytics';

const ACTION_ERROR = 'Something went wrong. Please try again.';
const EMPTY_VALUE = '—';
const NO_MOVE_TOOLTIP = "You don't have permission to move applicants. Ask an admin.";

function errorMessage(error: unknown): string {
  return error instanceof EmployerApplicantsApiError ? error.message : ACTION_ERROR;
}

export default function ApplicantReviewPanel({
  score, scoreJobStatus = null, applicationId, currentStageId, archived, stages, reasons, stageChanges, onDone,
  showActions = true,
}: {
  score: ApplicantScore | null;
  scoreJobStatus?: ScoreJobStatus | null;
  applicationId: string;
  currentStageId: string;
  archived: boolean;
  stages: Stage[];
  reasons: ArchiveReason[];
  stageChanges: StageChange[];
  onDone: () => Promise<void> | void;
  /** False when a sticky ApplicantActionBar above already owns move + archive. */
  showActions?: boolean;
}) {
  const [stageId, setStageId] = useState(currentStageId);
  const [moveNote, setMoveNote] = useState('');
  const [archiveNote, setArchiveNote] = useState('');
  const [reasonId, setReasonId] = useState(reasons[0]?.id ?? '');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { trackMove, trackArchive, trackRescore } = useApplicantReviewAnalytics(applicationId);

  // UX gates only — the backend enforces truth. Unknown role → allow.
  const { viewerRole, viewerCanMoveApplicants, viewerCanArchiveApplicants, company } = useEmployer();
  const params = useParams<{ postingId: string }>();
  const postingId = typeof params.postingId === 'string' ? params.postingId : '';

  // Engagement event: once per applicant panel open (ref-guard → re-renders for the
  // same applicant never double-fire; no applicant → no event).
  const viewedApplicantRef = useRef<string | null>(null);
  useEffect(() => {
    if (!applicationId || viewedApplicantRef.current === applicationId) return;
    viewedApplicantRef.current = applicationId;
    trackEvent('applicants_viewed', { companyId: company?.id ?? '', applicantId: applicationId, jobId: postingId });
  }, [applicationId, company?.id, postingId]);

  const allowMove = viewerRole ? canMoveApplicant(viewerRole, viewerCanMoveApplicants) : true;
  const allowArchive = viewerRole ? canArchiveApplicant(viewerRole, viewerCanArchiveApplicants) : true;
  const allowRescore = viewerRole ? canRescoreApplicant(viewerRole) : true;

  async function run(action: () => Promise<unknown>): Promise<boolean> {
    setBusy(true); setError(null);
    try { await action(); await onDone(); return true; }
    catch (caught) { setError(errorMessage(caught)); return false; }
    finally { setBusy(false); }
  }

  async function handleMoveStage() {
    const ok = await run(() => moveApplicant(applicationId, { stageId, note: moveNote || undefined }));
    if (!ok) return;
    trackMove(currentStageId, stageId);
    trackEvent('applicants_moved_stage', { companyId: company?.id ?? '', applicantId: applicationId, jobId: postingId, fromStage: stageName(currentStageId), toStage: stageName(stageId) });
    setMoveNote('');
  }

  async function handleConfirmArchive() {
    const ok = await run(() => archiveApplicant(applicationId, { reasonId, note: archiveNote || undefined }));
    if (!ok) return;
    trackArchive(reasonId);
    trackEvent('applicants_archived', { companyId: company?.id ?? '', applicantId: applicationId, jobId: postingId, ...(reasonId ? { reasonId } : {}) });
    setConfirmOpen(false);
    setArchiveNote('');
  }

  // A queued/processing job means the worker owns this application right now (C11).
  const isRescoring = scoreJobStatus?.status === 'queued' || scoreJobStatus?.status === 'processing';
  const handleRescore = () => void run(() => rescoreApplicant(applicationId)).then((ok) => { if (ok) trackRescore(); });

  const hasScore = Boolean(score && score.processingError == null && score.score != null);
  const tint = score ? (TIER_COLOR[score.tier] ?? 'var(--accent)') : 'var(--ink-muted)';
  const stageName = (id: string | null): string => (id ? stages.find((s) => s.id === id)?.text ?? EMPTY_VALUE : EMPTY_VALUE);
  const latest = [...stageChanges].sort((a, b) => new Date(b.movedAt ?? 0).getTime() - new Date(a.movedAt ?? 0).getTime())[0];
  const changeCount = stageChanges.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow-sm)', padding: 16, boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {hasScore && score ? (
          <div style={{ background: 'var(--surface-sunken)', borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
              <span className="font-display" style={{ fontSize: '2.6rem', fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>{score.score}</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--ink-muted)' }}>/ 100</span>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                {isRescoring && <Badge variant="neutral">Rescoring…</Badge>}
                <Badge variant="neutral" style={{ background: tint, color: 'var(--text-on-accent)' }}>{score.tier}</Badge>
                {allowRescore && <RescoreButton isRescoring={isRescoring} disabled={isRescoring || busy} onClick={handleRescore} />}
              </div>
            </div>
            <div style={{ marginTop: 10, height: 6, borderRadius: 999, background: 'var(--border)', overflow: 'hidden' }}>
              <div style={{ width: `${Math.max(0, Math.min(100, score.score))}%`, height: '100%', background: tint, borderRadius: 999 }} />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface-sunken)', borderRadius: 14, padding: '14px 16px', color: 'var(--ink-muted)', fontWeight: 600 }}>
            <span>{isRescoring ? 'Scoring in progress' : 'Not scored yet'}</span>
            {allowRescore && <span style={{ marginLeft: 'auto' }}><RescoreButton isRescoring={isRescoring} disabled={isRescoring || busy} onClick={handleRescore} /></span>}
          </div>
        )}

        {hasScore && score && (
          <Stack gap={8}>
            <SectionLabel>Skills</SectionLabel>
            <SkillRow label="Matched" skills={score.matchedSkills} variant="success" />
            <SkillRow label="Missing" skills={score.missingSkills} variant="warning" />
            <SkillRow label="Bonus" skills={score.bonusSkills ?? []} variant="info" />
          </Stack>
        )}

        {hasScore && score && (
          <div style={{ display: 'flex', gap: 8 }}>
            <FitTile icon={<Briefcase size={13} />} label="Experience" value={score.experienceFit} />
            <FitTile icon={<MapPin size={13} />} label="Location" value={score.locationFit} />
            <FitTile icon={<Clock size={13} />} label="Notice" value={score.noticePeriodFit} />
          </div>
        )}

        {score?.explanation && (
          <Stack gap={6}>
            <SectionLabel>Summary</SectionLabel>
            <p style={{ margin: 0, fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--ink-2)' }}>{score.explanation}</p>
          </Stack>
        )}
      </div>

      {/* Action bar — hidden when a sticky bar above the panel owns these actions */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        {error && <div style={{ marginBottom: 10 }}><Alert type="error">{error}</Alert></div>}
        {!showActions ? null : archived ? (
          allowArchive
            ? <Button variant="secondary" loading={busy} onClick={() => void run(() => unarchiveApplicant(applicationId))}>Unarchive applicant</Button>
            : <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--ink-muted)' }}>This applicant is archived.</p>
        ) : (
          <Stack gap={10}>
            <Stack dir="row" gap={10} align="end">
              <div style={{ flex: 1 }} title={allowMove ? undefined : NO_MOVE_TOOLTIP}>
                <Select label="Move to" value={stageId} disabled={!allowMove} options={stages.map((s) => ({ value: s.id, label: s.text }))} onChange={(e) => setStageId(e.target.value)} />
              </div>
              <div style={{ flex: 1.4 }}><Input label="Note" value={moveNote} disabled={!allowMove} onChange={(e) => setMoveNote(e.target.value)} /></div>
            </Stack>
            <Stack dir="row" gap={10}>
              <Button style={{ flex: 1 }} loading={busy} disabled={!allowMove || stageId === currentStageId} onClick={() => void handleMoveStage()}>Move stage</Button>
              {allowArchive && <Button style={{ flex: 1 }} variant="danger" onClick={() => setConfirmOpen(true)}>Archive</Button>}
            </Stack>
          </Stack>
        )}
        <div style={{ marginTop: 12, fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
          {latest
            ? `${stageName(latest.toStageId)} · ${latest.movedAt ? formatRelativeTime(latest.movedAt) : EMPTY_VALUE} · ${changeCount} change${changeCount > 1 ? 's' : ''}`
            : 'No stage changes yet'}
        </div>
      </div>
      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Archive applicant"
        footer={(<>
          <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="danger" loading={busy} disabled={!reasonId} onClick={() => void handleConfirmArchive()}>Confirm archive</Button>
        </>)}
      >
        <Stack gap={12}>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--ink-2)' }}>Archiving removes this applicant from the active pipeline. You can unarchive later.</p>
          <Select label="Reason" value={reasonId} options={reasons.map((r) => ({ value: r.id, label: r.text }))} onChange={(e) => setReasonId(e.target.value)} />
          <Textarea label="Note (optional)" rows={2} style={{ minHeight: 'auto' }} value={archiveNote} onChange={(e) => setArchiveNote(e.target.value)} />
        </Stack>
      </Modal>
    </div>
  );
}
