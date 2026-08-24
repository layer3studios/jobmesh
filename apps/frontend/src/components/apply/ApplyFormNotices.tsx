'use client';
// FILE: src/components/apply/ApplyFormNotices.tsx
// Every banner that can sit between the progress indicator and the fields: the
// blocking notices (task changed, posting closed, deadline passed), the deadline
// warning, and the transient restore/expired/form errors.
//
// THEY LIVE TOGETHER because their ORDER is the design. A blocking notice must
// out-rank a warning, and the deadline warning must not show while a blocking
// notice is up — that ordering is easy to break silently when the branches are
// scattered through a 140-line card.
//
// Split from ApplyFormClient for size (section 2).

import Link from 'next/link';
import { Alert, Button } from '@/components/ui';
import type { BlockingNotice } from './apply-form-constants';

export interface ApplyFormNoticesProps {
  notice: BlockingNotice | null;
  deadlineLabel: string | null;
  restoreNotice: string | null;
  expiredNotice: string | null;
  formError?: string;
  companySlug: string;
  copyState: 'idle' | 'copied' | 'failed';
  onCopyMyWork: () => void;
  myWorkAsText: () => string;
}

export default function ApplyFormNotices({
  notice, deadlineLabel, restoreNotice, expiredNotice, formError,
  companySlug, copyState, onCopyMyWork, myWorkAsText,
}: ApplyFormNoticesProps) {
  return (
    <>
      {/* Non-dismissible: refreshing is the only correct action, and letting this
          be closed leaves someone submitting against a task that no longer exists. */}
      {notice?.kind === 'assignment_changed' && (
        <Alert type="warning">
          <p>{notice.message}</p>
          <div style={{ marginTop: 8 }}>
            <Button type="button" size="sm" variant="secondary" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </div>
        </Alert>
      )}

      {/* The posting closed while they were working. No redirect and no draft
          clear — they may have spent hours on this, and the least we can do is
          let them take the work with them. */}
      {notice?.kind === 'posting_closed' && (
        <Alert type="error">
          <p>{notice.message}</p>
          <div style={{ marginTop: 8 }}>
            <Button type="button" size="sm" variant="secondary" onClick={onCopyMyWork}>
              {copyState === 'copied' ? 'Copied' : 'Copy my work'}
            </Button>
          </div>
          {/* The clipboard was refused. Never leave them pressing a button that
              does nothing — put the text on screen so they can select it. */}
          {copyState === 'failed' && (
            <div style={{ marginTop: 8 }}>
              <p style={{ fontSize: '0.78rem', marginBottom: 4 }}>
                Your browser blocked the clipboard. Copy your work from here:
              </p>
              <textarea
                readOnly
                aria-label="Your submission, ready to copy"
                value={myWorkAsText()}
                rows={6}
                style={{ width: '100%', fontSize: '0.78rem', fontFamily: 'inherit', padding: 8, borderRadius: 8 }}
              />
            </div>
          )}
        </Alert>
      )}

      {/* Lost the race: the deadline passed while they were filling the form.
          Says plainly that nothing was submitted, and offers the one useful
          next step rather than leaving them on a dead form. */}
      {notice?.kind === 'deadline_passed' && (
        <Alert type="error">
          <p>{notice.message}</p>
          <div style={{ marginTop: 8 }}>
            <Link href={`/apply/${companySlug}`}>
              <Button type="button" size="sm" variant="secondary">See other roles</Button>
            </Link>
          </div>
        </Alert>
      )}

      {/* Stated before the form, not after: the cost of finding out late is a
          filled-in form that cannot be submitted. */}
      {deadlineLabel && !notice && (
        <p style={{
          margin: 0, padding: '8px 12px', borderRadius: 8, fontSize: 12,
          background: 'var(--warning-soft)', color: 'var(--warning)',
        }}>
          Applications close on {deadlineLabel}
        </p>
      )}

      {restoreNotice && <Alert type="warning">{restoreNotice}</Alert>}
      {expiredNotice && <Alert type="warning">{expiredNotice}</Alert>}
      {formError && <Alert type="error">{formError}</Alert>}
    </>
  );
}
