// FILE: src/components/seeker/legal/PrivacySections.ts
// Static content for the privacy notice (Privacy.tsx). Plain language, written
// as a founder explaining the product — no legalese. Key points + 12 sections.

import { GRIEVANCE_EMAIL } from '../../shared/consent-copy';

export const KEY_POINTS: string[] = [
  "We collect only what's needed to match you with jobs.",
  'Your resume PDF is deleted after parsing — we keep the structured profile, not the file.',
  'Resume text may be processed by Google AI (outside India) — only if you consent.',
  'You can withdraw consent or delete your data anytime from your Account Privacy page.',
  `Questions? Email ${GRIEVANCE_EMAIL}.`,
];

export interface PrivacySection { title: string; body: string }

export const SECTIONS: PrivacySection[] = [
  {
    title: '1. Who we are',
    body: 'JobMesh (jobmesh.in) is operated by Layer3Studios. We help job seekers in India find and apply to roles. This notice explains what we do with your data and the choices you have.',
  },
  {
    title: '2. What data we collect',
    body: `We collect different data for different purposes:
• Account: your name, email, and photo (from Google sign-in).
• Profile: skills, saved jobs, applied jobs, daily goal.
• Resume (optional): the file you upload, and the structured profile we build from it.
• Applications: the details you send to an employer when you apply.
We only ask for what a given feature needs.`,
  },
  {
    title: '3. Why we collect it',
    body: `• To store and show your profile (storing your profile).
• To read your resume into a structured profile (parsing your resume).
• To match you with relevant jobs (matching you with jobs).
• To share an application with an employer you choose (apply to posting).
Each purpose is tied to a specific consent you give.`,
  },
  {
    title: '4. Who we share it with',
    body: `We share your data with:
• Employers you choose to apply to — only the application you send them.
• Google AI services — only your resume text, and only for parsing, if you consent.
We do not sell your data, and we do not share it with advertisers or anyone else.`,
  },
  {
    title: '5. Cross-border transfer',
    body: 'When you upload a resume, the text may be processed by Google\'s AI services hosted outside India. We do not store your resume PDF after parsing. This transfer happens only if you consent, and we flag it on your consent record.',
  },
  {
    title: '6. How long we keep it',
    body: `• Applications: kept for the retention period set by the employer you applied to.
• Profile: kept until you delete it or your account.
• Audit log (records of consent and rights requests): kept 7 years, as required for compliance.`,
  },
  {
    title: '7. Your rights',
    body: 'You can ask us to give you a copy of your data (access), fix it (correction), delete it (erasure), or raise a complaint (grievance). Go to your Account Privacy page to exercise any of these.',
  },
  {
    title: '8. How to withdraw consent',
    body: 'Withdrawing consent is as easy as giving it. Open your Account Privacy page, find the consent you want to withdraw, and click Withdraw. Some features (like resume matching) may stop working once the consent they rely on is withdrawn.',
  },
  {
    title: '9. Data security',
    body: 'Your data is encrypted at rest. Resume files are served through short-lived signed URLs. We do not run third-party ads and we do not sell your information.',
  },
  {
    title: '10. Children',
    body: 'JobMesh is for adults looking for work. We do not knowingly collect data from anyone under 18.',
  },
  {
    title: '11. Changes to this notice',
    body: 'If we make a material change, we update the notice version and ask you to consent again before we rely on the new terms. Small clarifications may be made without re-consent.',
  },
  {
    title: '12. Grievance officer',
    body: `Reach our grievance officer at ${GRIEVANCE_EMAIL}. We respond to rights requests and complaints within 90 days, as required by the DPDP Act.`,
  },
];
