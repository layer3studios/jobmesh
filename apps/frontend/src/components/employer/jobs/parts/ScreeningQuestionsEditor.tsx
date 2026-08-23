'use client';
// FILE: src/components/employer/jobs/parts/ScreeningQuestionsEditor.tsx
// The "Screening questions" block on the posting form. Owns the list; each row
// owns its own fields (ScreeningQuestionCard).
//
// Controlled by the parent form so the questions save with the posting in one
// request — a separate save button here would let someone publish a posting whose
// questions never made it, which is worse than no questions at all.

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Stack } from '@/components/ui';
import { COPY } from '@/theme/brand';
import { MAXIMUM_SCREENING_QUESTIONS, type ScreeningQuestion } from '@/types/employer-jobs';
import ScreeningQuestionCard from './ScreeningQuestionCard';
import { createQuestion, moveQuestion, renumber } from './screening-question-helpers';

const TEXT = COPY.employer.screening;

export default function ScreeningQuestionsEditor({ questions, onChange }: {
  questions: ScreeningQuestion[];
  onChange: (next: ScreeningQuestion[]) => void;
}) {
  // Which rows are expanded. A newly added question opens automatically — it is
  // empty, and collapsing it would hide the fields the employer just asked for.
  const [openIds, setOpenIds] = useState<string[]>([]);
  const isFull = questions.length >= MAXIMUM_SCREENING_QUESTIONS;

  const toggle = (id: string) => setOpenIds((current) => (
    current.includes(id) ? current.filter((openId) => openId !== id) : [...current, id]
  ));

  function handleAdd() {
    const question = createQuestion(questions.length + 1);
    onChange([...questions, question]);
    setOpenIds((current) => [...current, question.id]);
  }

  function handleRemove(index: number) {
    const removed = questions[index];
    onChange(renumber(questions.filter((_, i) => i !== index)));
    setOpenIds((current) => current.filter((openId) => openId !== removed.id));
  }

  return (
    <Stack gap={10}>
      <div>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
          {TEXT.sectionTitle}
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--ink-muted)', maxWidth: '62ch' }}>
          {TEXT.sectionBody}
        </p>
      </div>

      {questions.map((question, index) => (
        <ScreeningQuestionCard
          key={question.id}
          question={question}
          index={index}
          total={questions.length}
          isOpen={openIds.includes(question.id)}
          onToggle={() => toggle(question.id)}
          onChange={(next) => onChange(questions.map((row, i) => (i === index ? next : row)))}
          onMove={(direction) => onChange(moveQuestion(questions, index, direction))}
          onRemove={() => handleRemove(index)}
        />
      ))}

      <Stack gap={8} dir="row" align="center" wrap>
        <Button type="button" variant="secondary" size="sm" onClick={handleAdd} disabled={isFull}>
          <Stack gap={6} dir="row" align="center">
            <Plus size={14} aria-hidden="true" />
            {TEXT.addQuestion}
          </Stack>
        </Button>
        {/* Stated only once the limit is reached — an always-visible cap reads as a
            restriction rather than an answer to "why is this disabled?". */}
        {isFull && <span style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{TEXT.limitReached}</span>}
      </Stack>
    </Stack>
  );
}
