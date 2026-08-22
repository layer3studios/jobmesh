// FILE: settings/email/parts/EmailTemplatePreviews.tsx
// Read-only previews of the three automatic candidate emails, so an employer can
// see what goes out under their name without having to trigger one.
//
// The copy here MIRRORS the backend templates
// (services/email/templates/{application-received,interview-invitation,rejection-application}
// -template.js). It is a transcription, not a render: if the wording changes there,
// change it here. Only the first paragraph is shown — enough to recognise the
// email, not so much that this becomes a second copy to maintain in full.

interface Props {
  companyName: string;
  /** Sample values so the preview reads like a real email rather than {braces}. */
  sampleRole?: string;
}

const SAMPLE_CANDIDATE = 'Priya';
const DEFAULT_ROLE = 'Senior Engineer';

export default function EmailTemplatePreviews({ companyName, sampleRole = DEFAULT_ROLE }: Props) {
  const previews = [
    {
      name: 'Application received',
      when: 'Sent immediately when someone applies.',
      subject: `We received your application — ${sampleRole} at ${companyName}`,
      body: `Hi ${SAMPLE_CANDIDATE}, thanks for applying to ${sampleRole} at ${companyName}. We've received your application and our team will review it shortly.`,
    },
    {
      name: 'Interview invitation',
      when: 'Sent when you schedule an interview.',
      subject: `Interview invitation — ${sampleRole} at ${companyName}`,
      body: `Hi ${SAMPLE_CANDIDATE}, we'd like to invite you to an interview for the ${sampleRole} position at ${companyName}. The details are below, with a calendar invitation attached.`,
    },
    {
      name: 'Rejection',
      when: 'Sent when you archive a candidate, unless you opt out.',
      subject: `Update on your application for ${sampleRole}`,
      body: `Hi ${SAMPLE_CANDIDATE}, thank you for applying for the ${sampleRole} position at ${companyName}. We have reviewed your application carefully and have decided not to move forward at this time.`,
    },
  ];

  return (
    <div style={{ marginTop: 24, maxWidth: 640 }}>
      <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
        What candidates receive
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {previews.map((preview) => (
          <div key={preview.name} style={{
            background: 'var(--surface-raised)', border: '0.5px solid var(--border)',
            borderRadius: 12, padding: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{preview.name}</span>
              <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{preview.when}</span>
            </div>
            <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--ink-faint)' }}>Subject</p>
            <p style={{ margin: '2px 0 0', fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
              {preview.subject}
            </p>
            <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--ink-faint)' }}>Preview</p>
            <p style={{ margin: '2px 0 0', fontSize: 13, lineHeight: 1.6, color: 'var(--ink-2)' }}>
              {preview.body}
            </p>
          </div>
        ))}
      </div>
      <p style={{ margin: '10px 0 0', fontSize: 12, color: 'var(--ink-faint)' }}>
        Email templates are standard for now. Custom templates coming soon.
      </p>
    </div>
  );
}
