'use client';
// FILE: src/components/seeker/profile/ResumeSheet.tsx
// The resume upload, as a sheet over the profile — because the profile is
// where the result lands, so that is where the upload belongs. Same state
// machine the old /resume page ran: ConsentGate → drop zone → parsing screen;
// 'done' hands the fresh profile back and closes; 'unchanged' just closes.
import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { Drawer, useToast } from '../../ui';
import ConsentGate from '../../shared/ConsentGate';
import ResumeUploadZone from '../ResumeUploadZone';
import ResumeParsingScreen from '../ResumeParsingScreen';
import { useResumeParseJob } from '../../../hooks/seeker/useResumeParseJob';
import type { ResumeUploadResult } from '../../../types/seeker-profile';

const DATA_ITEMS = [
  'resume text',
  'parsed profile (name, skills, experience, education, contact)',
];

const WHAT_HAPPENS = [
  'We read the PDF once and delete it.',
  'Skills, roles and education become an editable profile.',
  'Every role on the board gets a match score against it.',
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** A new profile was parsed — the page should reload it. */
  onParsed: () => void;
}

export default function ResumeSheet({ isOpen, onClose, onParsed }: Props) {
  const { showToast } = useToast();
  const [jobId, setJobId] = useState<string | null>(null);
  const { status, errorCode, errorMessage } = useResumeParseJob(jobId);

  useEffect(() => {
    if (status !== 'done') return;
    const t = setTimeout(() => { onParsed(); onClose(); setJobId(null); }, 900);
    return () => clearTimeout(t);
  }, [status, onParsed, onClose]);

  const handleUploadComplete = (result: ResumeUploadResult) => {
    if (result.kind === 'unchanged') {
      showToast('info', 'Same resume as before — your profile is already up to date.');
      onClose();
      return;
    }
    setJobId(result.jobId);
  };

  let body: React.ReactNode;
  if (status === 'polling') body = <ResumeParsingScreen errorCode={null} errorMessage={null} onRetry={() => setJobId(null)} />;
  else if (status === 'failed' || status === 'timeout') body = <ResumeParsingScreen errorCode={errorCode} errorMessage={errorMessage} onRetry={() => setJobId(null)} />;
  else if (status === 'done') {
    body = (
      <div className="glass ws-section rise" style={{ textAlign: 'center' }}>
        <p className="rs-drop__title"><Check size={22} style={{ color: 'var(--success)', verticalAlign: '-4px' }} /> Profile ready</p>
        <p className="rs-tip" style={{ marginTop: 6 }}>Loading it in…</p>
      </div>
    );
  } else {
    body = (
      <ConsentGate
        purpose="resume_parsing"
        dataItems={DATA_ITEMS}
        crossBorderTransfer
        title="Resume parsing consent"
        description="We'll extract structured data from your resume using AI to match you with relevant jobs. Your PDF is deleted after parsing — only the structured profile is kept."
      >
        <div style={{ display: 'grid', gap: 18 }}>
          <ResumeUploadZone onUploadComplete={handleUploadComplete} />
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
            {WHAT_HAPPENS.map((line, i) => (
              <li key={line} className="rise" style={{ '--i': i + 2, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--ink-muted)' } as React.CSSProperties}>
                <span style={{ width: 20, height: 20, borderRadius: 6, border: '1px solid var(--border)', display: 'inline-grid', placeItems: 'center', fontFamily: 'var(--font-jetbrains-mono), monospace', fontSize: 10.5, color: 'var(--ink)' }}>{i + 1}</span>
                {line}
              </li>
            ))}
          </ul>
        </div>
      </ConsentGate>
    );
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Upload your resume" width="lg">
      <div style={{ display: 'grid', gap: 14 }}>{body}</div>
    </Drawer>
  );
}
