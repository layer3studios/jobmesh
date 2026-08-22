'use client';
// FILE: src/components/seeker/resume/ResumeUpload.tsx
// Resume upload page (/resume) — the F2 state machine. ConsentGate (4.5B) collects
// resume_parsing consent before the upload zone is revealed (C9). A queued upload
// swaps to the parsing screen while useResumeParseJob polls; 'done' routes to the
// profile, 'failed'/'timeout' shows the error view with Retry. The dedup fast-path
// skips polling entirely — toast + straight to /profile (D7/D8).

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, PageHeader, Spinner, useToast } from '../../ui';
import ConsentGate from '../../shared/ConsentGate';
import ResumeUploadZone from '../ResumeUploadZone';
import ResumeParsingScreen from '../ResumeParsingScreen';
import { useResumeParseJob } from '../../../hooks/seeker/useResumeParseJob';
import type { ResumeUploadResult } from '../../../types/seeker-profile';

const DATA_ITEMS = [
  'resume text',
  'parsed profile (name, skills, experience, education, contact)',
];

export default function ResumeUpload() {
  const router = useRouter();
  const { showToast } = useToast();
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const { status, errorCode, errorMessage } = useResumeParseJob(currentJobId);

  useEffect(() => {
    if (status === 'done') router.replace('/profile');
  }, [status, router]);

  const handleUploadComplete = (result: ResumeUploadResult) => {
    if (result.kind === 'unchanged') {
      showToast('info', 'Resume unchanged — profile already up to date.');
      router.replace('/profile');
      return;
    }
    setCurrentJobId(result.jobId);
  };

  const handleRetry = () => setCurrentJobId(null);

  const renderBody = () => {
    if (status === 'polling') return <ResumeParsingScreen errorCode={null} errorMessage={null} onRetry={handleRetry} />;
    if (status === 'failed' || status === 'timeout') {
      return <ResumeParsingScreen errorCode={errorCode} errorMessage={errorMessage} onRetry={handleRetry} />;
    }
    if (status === 'done') {
      return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={26} /></div>;
    }
    return (
      <ConsentGate
        purpose="resume_parsing"
        dataItems={DATA_ITEMS}
        crossBorderTransfer
        title="Resume parsing consent"
        description="We'll extract structured data from your resume using AI to match you with relevant jobs. Your PDF is deleted after parsing — only the structured profile is kept."
      >
        <ResumeUploadZone onUploadComplete={handleUploadComplete} />
      </ConsentGate>
    );
  };

  return (
    <Container size="md" style={{ paddingTop: 32, paddingBottom: 60 }}>
      <PageHeader label="SEEKER" title="Upload your resume" />
      {renderBody()}
    </Container>
  );
}
