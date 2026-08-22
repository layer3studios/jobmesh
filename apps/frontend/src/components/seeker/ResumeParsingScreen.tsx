'use client';
// FILE: src/components/seeker/ResumeParsingScreen.tsx
// The screen shown between upload and profile. With errorCode null it renders the
// honest "in progress" view — indeterminate spinner, a rotating status line, and an
// explicit 15-30s expectation, no fake percentage bar (R3). With errorCode set it
// renders the friendly error view (mapped copy + Retry + a paste-text escape hatch).

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, Spinner, Alert, Button, Stack } from '../ui';

// Frontend copy is a UX concern, not part of the API contract (D5).
const RESUME_PARSE_ERROR_MESSAGES: Record<string, string> = {
  PDF_TEXT_EXTRACTION_FAILED:
    "We couldn't read text from that PDF — it may be scanned or image-based. Please paste your resume text instead.",
  GEMMA_UNAVAILABLE:
    'Resume parsing is temporarily unavailable. Please try again in a minute.',
  RESUME_PARSE_FAILED: "We couldn't parse your resume. Please try again.",
  POLL_TIMEOUT:
    'This is taking longer than expected. Your resume may still be processing — refresh /profile in a minute, or try again.',
};

const GENERIC_ERROR_MESSAGE = "We couldn't parse your resume. Please try again.";

const STATUS_LINES = [
  'Reading your PDF…',
  'Understanding your experience…',
  'Finalising your profile…',
];
const STATUS_ROTATE_MILLISECONDS = 4000;

function resolveMessage(errorCode: string, errorMessage: string | null): string {
  const mapped = RESUME_PARSE_ERROR_MESSAGES[errorCode];
  if (mapped) return mapped;
  // Unmapped code — a new backend error the frontend copy map hasn't caught up with.
  // Fall back to the server's message; warn once so it surfaces in dev (C5).
  console.warn(`[ResumeParsingScreen] unmapped errorCode: ${errorCode}`);
  return errorMessage || GENERIC_ERROR_MESSAGE;
}

interface Props {
  errorCode: string | null;
  errorMessage: string | null;
  onRetry: () => void;
}

export default function ResumeParsingScreen({ errorCode, errorMessage, onRetry }: Props) {
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    if (errorCode !== null) return;
    const timer = setInterval(
      () => setLineIndex((prev) => (prev + 1) % STATUS_LINES.length),
      STATUS_ROTATE_MILLISECONDS,
    );
    return () => clearInterval(timer);
  }, [errorCode]);

  if (errorCode !== null) {
    return (
      <Card padding="lg" style={{ maxWidth: 460, margin: '40px auto', textAlign: 'center' }}>
        <Stack gap={16}>
          <Alert type="error">{resolveMessage(errorCode, errorMessage)}</Alert>
          <Stack gap={10} dir="row" align="center" justify="center" wrap>
            <Button onClick={onRetry}>Try again</Button>
            <Link href="/resume" style={{ fontSize: '0.85rem', color: 'var(--accent)' }}>
              Paste text instead
            </Link>
          </Stack>
        </Stack>
      </Card>
    );
  }

  return (
    <Card padding="lg" style={{ maxWidth: 460, margin: '40px auto', textAlign: 'center' }}>
      <Stack gap={14} align="center">
        <Spinner size={30} />
        <h2 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--ink)' }}>Parsing your resume…</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--ink-muted)' }}>
          Usually 15–30 seconds — no need to refresh.
        </p>
        <p aria-live="polite" style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--accent)' }}>
          {STATUS_LINES[lineIndex]}
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>
          You can safely close this tab — we'll finish parsing in the background.
        </p>
      </Stack>
    </Card>
  );
}
