'use client';
// FILE: src/components/employer/jobs/useAddTimesForm.ts
// The per-batch add-times form (type + its one detail field). Type and link
// live HERE, not on the posting defaults: each batch of times can be a
// different kind of interview.
//
// Pre-fill, in order: the times already on the selected date → the last values
// used this session → Video with empty fields. Session memory is a ref, never
// persisted.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { InterviewMode, InterviewTime, PhoneCallDirection } from '@/types/employer-interviews';
import { activeTimesOnDate, dominantMode, mostCommon } from './day-time-helpers';

export interface AddTimesForm {
  mode: InterviewMode;
  meetingUrl: string;
  phoneNumber: string;
  phoneCallDirection: PhoneCallDirection;
  address: string;
  arrivalInstructions: string;
}

const EMPTY_FORM: AddTimesForm = {
  mode: 'video', meetingUrl: '', phoneNumber: '',
  phoneCallDirection: 'we_call', address: '', arrivalInstructions: '',
};

/** The detail field the chosen type requires — the Add gate reads this. */
export function requiredFieldFilled(form: AddTimesForm): boolean {
  if (form.mode === 'video') return form.meetingUrl.trim().length > 0;
  if (form.mode === 'phone') return form.phoneNumber.trim().length > 0;
  return form.address.trim().length > 0;
}

export function useAddTimesForm(selectedDate: string | null, times: InterviewTime[]) {
  const [form, setForm] = useState<AddTimesForm>(EMPTY_FORM);
  // Last values the employer actually used — the fallback for an empty date.
  const lastUsedRef = useRef<AddTimesForm>(EMPTY_FORM);
  // Pre-fill once per date, so typing is never clobbered by a background refetch.
  const prefilledDateRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedDate || prefilledDateRef.current === selectedDate) return;
    prefilledDateRef.current = selectedDate;

    const dayTimes = activeTimesOnDate(times, selectedDate);
    if (dayTimes.length === 0) {
      setForm({ ...lastUsedRef.current });
      return;
    }
    // Inherit what this date already uses; fall back to session memory for the
    // fields the time documents do not carry.
    setForm({
      ...lastUsedRef.current,
      mode: dominantMode(dayTimes) ?? lastUsedRef.current.mode,
      meetingUrl: mostCommon(dayTimes.map((time) => time.meetingUrl)) ?? '',
      address: mostCommon(dayTimes.map((time) => time.locationText)) ?? lastUsedRef.current.address,
    });
  }, [selectedDate, times]);

  const update = useCallback(<K extends keyof AddTimesForm>(key: K, value: AddTimesForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  }, []);

  /** Call after a successful add so the next empty date inherits these values. */
  const rememberUsed = useCallback(() => { lastUsedRef.current = form; }, [form]);

  return { form, update, rememberUsed };
}
