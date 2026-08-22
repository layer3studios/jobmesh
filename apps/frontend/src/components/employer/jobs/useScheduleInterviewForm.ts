// FILE: src/components/employer/jobs/useScheduleInterviewForm.ts
// Form state + validation for ScheduleInterviewModal, split out to keep both
// files under the line cap. Every entered time is IST wall-clock and converted
// to UTC via ist-datetime.ts — never new Date(rawValue).

import { useState } from 'react';
import type { InterviewMode, PhoneCallDirection, ProposeInterviewInput } from '../../../types/employer-interviews';
import { istLocalToUtcIso } from '../../../utils/ist-datetime';

export const MINIMUM_SLOT_COUNT = 2;
export const MAXIMUM_SLOT_COUNT = 4;
const ABSOLUTE_HTTP_URL_PATTERN = /^https?:\/\/\S+$/i;

export interface SlotError { index: number; message: string }

/** One proposed-time row: value + a stable identity for React keys. Index keys
 *  would re-associate DOM inputs when a middle row is removed. */
export interface TimeRow { rowId: string; value: string }

let nextRowIdCounter = 0;
const createTimeRow = (): TimeRow => ({ rowId: `time-row-${nextRowIdCounter++}`, value: '' });

export function useScheduleInterviewForm() {
  const [mode, setModeState] = useState<InterviewMode>('video');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCallDirection, setPhoneCallDirection] = useState<PhoneCallDirection>('we_call');
  const [address, setAddress] = useState('');
  const [arrivalInstructions, setArrivalInstructions] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [times, setTimes] = useState<TimeRow[]>(() => [createTimeRow(), createTimeRow()]);

  /** Leaving video clears the meeting link so a stale URL is never submitted. */
  function setMode(nextMode: InterviewMode): void {
    if (mode === 'video' && nextMode !== 'video') setMeetingUrl('');
    setModeState(nextMode);
  }

  function setTimeAt(index: number, value: string): void {
    setTimes((current) => current.map((row, i) => (i === index ? { ...row, value } : row)));
  }
  function addTimeRow(): void {
    setTimes((current) => (current.length < MAXIMUM_SLOT_COUNT ? [...current, createTimeRow()] : current));
  }
  function removeTimeRow(index: number): void {
    setTimes((current) => (index >= MINIMUM_SLOT_COUNT ? current.filter((_, i) => i !== index) : current));
  }

  /** Per-row inline errors. Empty rows read as "not entered yet", not errors. */
  function slotErrors(now: Date = new Date()): SlotError[] {
    const errors: SlotError[] = [];
    const seen = new Map<string, number>();
    times.forEach((row, index) => {
      if (!row.value) return;
      const utcIso = istLocalToUtcIso(row.value);
      if (!utcIso) { errors.push({ index, message: 'Enter a valid date and time.' }); return; }
      if (new Date(utcIso) <= now) { errors.push({ index, message: 'This time is in the past.' }); return; }
      if (seen.has(utcIso)) errors.push({ index, message: 'This time is the same as another option.' });
      else seen.set(utcIso, index);
    });
    return errors;
  }

  function conditionalFieldError(): string | null {
    if (mode === 'video') {
      if (!meetingUrl.trim()) return 'A meeting link is required for video calls.';
      if (!ABSOLUTE_HTTP_URL_PATTERN.test(meetingUrl.trim())) return 'Enter a full link starting with http:// or https://.';
    }
    if (mode === 'phone' && !phoneNumber.trim()) return 'A phone number is required.';
    if (mode === 'in_person' && !address.trim()) return 'An address is required.';
    return null;
  }

  const enteredTimes = times.map((row) => row.value).filter(Boolean);
  const canSubmit = enteredTimes.length >= MINIMUM_SLOT_COUNT
    && slotErrors().length === 0
    && conditionalFieldError() === null;

  function buildInput(): ProposeInterviewInput {
    return {
      proposedSlots: enteredTimes.map((time) => ({
        startAtUtc: istLocalToUtcIso(time) as string,
        durationMinutes,
      })),
      durationMinutes,
      mode,
      meetingUrl: mode === 'video' ? meetingUrl.trim() : null,
      locationText: mode === 'in_person' ? address.trim() : null,
      phoneNumber: mode === 'phone' ? phoneNumber.trim() : null,
      phoneCallDirection: mode === 'phone' ? phoneCallDirection : null,
      arrivalInstructions: mode === 'in_person' ? arrivalInstructions.trim() || null : null,
      interviewerEmployerUserIds: [],
      timezoneId: 'Asia/Kolkata',
    };
  }

  return {
    mode, setMode, meetingUrl, setMeetingUrl, phoneNumber, setPhoneNumber,
    phoneCallDirection, setPhoneCallDirection,
    address, setAddress, arrivalInstructions, setArrivalInstructions,
    durationMinutes, setDurationMinutes,
    times, setTimeAt, addTimeRow, removeTimeRow,
    slotErrors, conditionalFieldError, canSubmit, buildInput,
  };
}
