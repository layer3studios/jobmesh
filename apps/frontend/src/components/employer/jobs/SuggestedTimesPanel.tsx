'use client';
// FILE: src/components/employer/jobs/SuggestedTimesPanel.tsx
// "Suggest from availability" inside the add-times flow.
//
// PURELY ADDITIVE. This does not create anything. It fetches times derived from
// the signed-in teammate's weekly hours and, on confirm, ticks them into the SAME
// selection the manual chip grid uses — so the existing Add button, the same
// defaults sync and the same POST do the actual work. Nothing about manual slot
// creation changes, and a company that never sets availability sees this panel
// report "no hours set" and carry on exactly as before.
//
// Scoped to the ONE day being edited, because that is the unit this flow works in.
// The helper accepts any range; the panel asks for a day.

import { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { Button, Stack } from '@/components/ui';
import { COPY } from '@/theme/brand';
import { fetchSuggestedSlots } from '@/api/employer-me-api';
import { utcIsoToIstLocal } from '@/utils/ist-datetime';

const TEXT = COPY.employer.availability;

/** Start and end of one IST calendar day, as UTC instants the API can range over. */
function dayRangeUtc(dateIso: string): { from: string; to: string } {
  const from = new Date(`${dateIso}T00:00:00+05:30`);
  return { from: from.toISOString(), to: new Date(from.getTime() + 86400000).toISOString() };
}

/** "14:30" from an IST-local 'YYYY-MM-DDTHH:mm'. */
const clockOf = (istLocal: string) => istLocal.slice(11, 16);

export default function SuggestedTimesPanel({
  dateIso, durationMinutes, selectedIstLocals, onToggle,
}: {
  dateIso: string;
  durationMinutes: number;
  /** The manual grid's selection — suggestions tick into this same set. */
  selectedIstLocals: Set<string>;
  onToggle: (istLocal: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [skippedCount, setSkippedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadSuggestions() {
    setIsLoading(true);
    setError(null);
    try {
      const { from, to } = dayRangeUtc(dateIso);
      const result = await fetchSuggestedSlots(from, to, durationMinutes);
      // Converted once, here: the rest of the add flow speaks IST-local, and
      // mixing the two representations is how double-added times happen.
      setSuggestions(result.slots.map(utcIsoToIstLocal));
      setSkippedCount(result.skippedCount);
    } catch {
      setError(TEXT.suggestFailed);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 8, padding: 10,
      background: 'var(--surface-raised)',
    }}>
      <Stack gap={8}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
              {TEXT.suggestTitle}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--ink-muted)' }}>
              {TEXT.suggestBody}
            </p>
          </div>
          <Button variant="secondary" size="sm" loading={isLoading} onClick={() => void loadSuggestions()}>
            <Stack gap={6} dir="row" align="center">
              <CalendarClock size={14} aria-hidden="true" />
              {isLoading ? TEXT.suggestLoading : TEXT.suggestButton}
            </Stack>
          </Button>
        </div>

        {error && <p role="alert" style={{ margin: 0, fontSize: 12, color: 'var(--danger)' }}>{error}</p>}

        {suggestions !== null && suggestions.length === 0 && !error && (
          <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-faint)' }}>
            {/* Nothing back and nothing skipped means no hours are set at all —
                a different problem from "your hours are full", and a different fix. */}
            {skippedCount === 0 ? TEXT.suggestNoHours : TEXT.suggestEmpty}
          </p>
        )}

        {suggestions !== null && suggestions.length > 0 && (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {suggestions.map((istLocal) => {
                const isSelected = selectedIstLocals.has(istLocal);
                return (
                  <button
                    key={istLocal}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onToggle(istLocal)}
                    style={{
                      padding: '4px 10px', borderRadius: 999, fontSize: 12, cursor: 'pointer',
                      border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
                      background: isSelected ? 'var(--accent-soft)' : 'var(--surface)',
                      color: isSelected ? 'var(--accent)' : 'var(--ink)',
                      fontWeight: isSelected ? 600 : 400,
                    }}
                  >
                    {clockOf(istLocal)}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {skippedCount > 0 && (
                <span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>
                  {TEXT.suggestSkipped.replace('{count}', String(skippedCount))}
                </span>
              )}
              <span style={{ flex: 1 }} />
              <Button
                variant="link" size="sm"
                onClick={() => suggestions.filter((slot) => !selectedIstLocals.has(slot)).forEach(onToggle)}
              >
                {TEXT.suggestSelectAll}
              </Button>
            </div>
          </>
        )}
      </Stack>
    </div>
  );
}
