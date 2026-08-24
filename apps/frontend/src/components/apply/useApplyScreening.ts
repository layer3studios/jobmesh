'use client';
// FILE: src/components/apply/useApplyScreening.ts
// Answers to the posting's custom screening questions.
//
// THEY LIVE IN THEIR OWN MAP rather than in ApplyFormData: the questions are
// per-posting and arbitrary, so they have no fixed field names to add to that type.
//
// Split from ApplyFormClient for size (section 2).

import { useState } from 'react';
import type { PublicJob } from '@/types/public-apply';

export function useApplyScreening(questions: NonNullable<PublicJob['screeningQuestions']>) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setAnswer = (questionId: string, value: string) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
    // Clear the error as soon as they start answering; re-checked on blur/submit.
    setErrors((current) => {
      if (!current[questionId]) return current;
      const { [questionId]: _cleared, ...rest } = current;
      return rest;
    });
  };

  const blurAnswer = (questionId: string) => {
    const question = questions.find((row) => row.id === questionId);
    if (!question?.isRequired) return;
    const isEmpty = (answers[questionId] ?? '').trim() === '';
    setErrors((current) => (
      isEmpty ? { ...current, [questionId]: 'This question is required.' } : current
    ));
  };

  return { questions, answers, errors, setErrors, setAnswer, blurAnswer };
}

export type ApplyScreening = ReturnType<typeof useApplyScreening>;
export default useApplyScreening;
