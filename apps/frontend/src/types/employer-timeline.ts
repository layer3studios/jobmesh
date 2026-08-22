// FILE: src/types/employer-timeline.ts
// Shape contract for GET /api/employer/applicants/:id/timeline. Discriminated
// on `type`. The backend strips every internal id — events carry names, stage
// texts and timestamps only.

interface TimelineEventBase {
  timestamp: string;
}

export type TimelineEvent =
  | (TimelineEventBase & { type: 'applied' })
  | (TimelineEventBase & { type: 'scored'; score: number | null })
  | (TimelineEventBase & {
    type: 'stage_move';
    fromStage: string | null;
    toStage: string | null;
    actorName: string | null;
  })
  | (TimelineEventBase & { type: 'interview_proposed' })
  | (TimelineEventBase & { type: 'interview_booked'; bookedTime: string | null })
  | (TimelineEventBase & {
    type: 'interview_completed';
    recommendation: string | null;
    feedbackText: string | null;
  })
  | (TimelineEventBase & { type: 'interview_no_show' })
  | (TimelineEventBase & { type: 'interview_cancelled' })
  | (TimelineEventBase & { type: 'note_added'; text: string; authorName: string | null });

export type TimelineEventType = TimelineEvent['type'];
