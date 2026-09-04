// FILE: src/theme/copy-seeker-hire.ts
// The public "Hire with JobMesh" page at /hire — the employer pitch, served on
// the seeker host so a company that lands on jobmesh.in has somewhere to go
// before hire.jobmesh.in asks them to sign in. Every feature named here is one
// the employer product ships (see apps/backend/src/api/employer).

export const SEEKER_HIRE_COPY = {
  hire: {
    metaTitle: 'Hire with JobMesh — the engineer, not just the resume',
    metaDescription:
      'Post roles, get every applicant ranked by AI against your description, run take-homes, and book interviews from a shared time pool. Free.',

    badge: 'For companies',
    title: 'Hire the engineer, not just the resume.',
    lede: 'Every applicant scored against your description before you open a single CV. A pipeline you drag, take-homes you review in place, interviews that book themselves.',
    primaryCTA: 'Start hiring — free',
    secondaryCTA: 'See how it works',

    kanbanLabel: 'Ranked pipeline',
    kanbanColumns: [
      { name: 'Applied', count: 24 },
      { name: 'Screening', count: 8 },
      { name: 'Interview', count: 3 },
      { name: 'Offer', count: 1 },
    ],

    proofHeading: 'Engineered for signal.',
    proofLede: 'Ditch the noise. Every step that used to be a spreadsheet is one view.',
    features: [
      { title: 'Objective AI scoring', body: 'Each resume is scored 0–100 against your description, with the evidence, the moment it lands. Rank before you read.' },
      { title: 'Drag-and-drop pipeline', body: 'Screening, interview, offer — move candidates between stages, bulk-archive with a reason, and see who is stuck.' },
      { title: 'Take-home assignments', body: 'Build a library once, attach one to a posting, review submissions in place with a 1–5 rubric and a pass bar.' },
      { title: 'Shared interview pool', body: 'Your team adds free slots; the candidate books one. Calendar invites, reminders and feedback prompts are automatic.' },
      { title: 'Team roles', body: 'Founder, owner, member, interviewer — each sees exactly what they need. Invite by link; transfer ownership safely.' },
      { title: 'Referral links', body: 'Every teammate gets a trackable link per role, so you know which referral brought which hire.' },
    ],

    processHeading: 'Four steps. No spreadsheet.',
    steps: [
      { title: 'Post the role', body: 'Title, description, salary band, deadline. Screening questions and a take-home if you want one. Live in minutes.' },
      { title: 'Watch it rank', body: 'Applicants arrive already scored. Open the ranked table, filter by skill, sort by fit.' },
      { title: 'Move and review', body: 'Drag through stages. Review take-homes with your rubric. Leave notes your team can @mention.' },
      { title: 'Book and hire', body: 'One click sends a booking link into your shared pool. The candidate picks a slot. Mark the role filled.' },
    ],

    finalTitle: 'Your next hire is already in the mesh.',
    finalCTA: 'Start hiring',
    finalNote: 'Free to post. No card required.',
  },
} as const;
