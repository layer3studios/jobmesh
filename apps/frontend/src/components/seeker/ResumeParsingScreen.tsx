'use client';
// FILE: src/components/seeker/ResumeParsingScreen.tsx
// The screen between upload and profile. With errorCode null: three named
// stages and a bar that moves fast-to-slow on elapsed time (Conrad: a bar
// that starts quickly is abandoned half as often), never parks at 99%, and a
// line that says what is happening. With errorCode set: mapped copy, Retry,
// and the paste-text escape hatch.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, RefreshCw } from 'lucide-react';
import { Alert, Button, Stack } from '../ui';

// Frontend copy is a UX concern, not part of the API contract (D5).
const RESUME_PARSE_ERROR_MESSAGES: Record<string, string> = {
  PDF_TEXT_EXTRACTION_FAILED:
    "We couldn't read text from that PDF — it may be scanned or image-based. Paste your resume text instead.",
  GEMMA_UNAVAILABLE:
    'Resume parsing is temporarily unavailable. Please try again in a minute.',
  RESUME_PARSE_FAILED: "We couldn't parse your resume. Please try again.",
  POLL_TIMEOUT:
    'This is taking longer than expected. Your resume may still be processing — open your profile in a minute, or try again.',
};
const GENERIC_ERROR_MESSAGE = "We couldn't parse your resume. Please try again.";

const STAGES = ['Reading the PDF', 'Extracting skills & roles', 'Matching you to the market'] as const;
/** Elapsed seconds at which each stage is considered done. */
const STAGE_AT = [4, 14, 40];

function resolveMessage(errorCode: string, errorMessage: string | null): string {
  const mapped = RESUME_PARSE_ERROR_MESSAGES[errorCode];
  if (mapped) return mapped;
  console.warn(`[ResumeParsingScreen] unmapped errorCode: ${errorCode}`);
  return errorMessage || GENERIC_ERROR_MESSAGE;
}

/** Fast-to-slow: 50% of the bar in the first ~8s, then asymptotic to 92%. */
function progressFor(seconds: number): number {
  return Math.min(92, Math.round(92 * (1 - Math.exp(-seconds / 11))));
}

interface Props {
  errorCode: string | null;
  errorMessage: string | null;
  onRetry: () => void;
}

export default function ResumeParsingScreen({ errorCode, errorMessage, onRetry }: Props) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (errorCode !== null) return;
    const t = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [errorCode]);

  if (errorCode !== null) {
    return (
      <div className="glass ws-section rise" style={{ maxWidth: 520, margin: '24px auto' }}>
        <Stack gap={14}>
          <Alert type="error">{resolveMessage(errorCode, errorMessage)}</Alert>
          <Stack gap={10} dir="row" align="center" wrap>
            <Button onClick={onRetry} iconLeft={<RefreshCw size={13} />}>Try again</Button>
            <Link href="/resume" style={{ fontSize: 13, color: 'var(--ink-muted)', textDecoration: 'underline', textUnderlineOffset: 3 }}>
              Paste text instead
            </Link>
          </Stack>
        </Stack>
      </div>
    );
  }

  const pct = progressFor(seconds);
  const stageIndex = STAGE_AT.findIndex(t => seconds < t);
  const active = stageIndex === -1 ? STAGES.length - 1 : stageIndex;

  return (
    <div className="glass ws-section rise" style={{ maxWidth: 560, margin: '24px auto' }} aria-busy="true">
      <div className="rs-steps">
        <p className="ws-section__label" aria-live="polite">{STAGES[active]}…</p>
        <div className="rs-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Building your profile">
          <div className="rs-bar__fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="rs-stages">
          {STAGES.map((s, i) => (
            <span key={s} className="rs-stage" data-state={i < active ? 'done' : i === active ? 'active' : 'todo'}>
              {i < active ? <Check size={11} /> : <span style={{ fontVariantNumeric: 'tabular-nums' }}>{i + 1}</span>} {s}
            </span>
          ))}
        </div>
        <p className="rs-tip">
          {seconds < 12 ? 'Usually 15–30 seconds. No need to refresh.'
            : seconds < 40 ? 'Still working — longer resumes take a little more.'
            : 'Taking longer than usual. You can close this tab; we finish in the background and your profile will be ready.'}
        </p>
      </div>
    </div>
  );
}
