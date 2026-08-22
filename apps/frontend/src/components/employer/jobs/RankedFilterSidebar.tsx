'use client';
// FILE: src/components/employer/jobs/RankedFilterSidebar.tsx
// The Ranked tab's left filter panel. Same state shapes and callbacks as the
// old horizontal RankedFilterBar — this is a visual restructure only. Stage,
// score, archived and search stay client-side; experience, skills, location,
// applied-within and the resume/notes toggles stay server-side.

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  createInitialRankedFilterState, createInitialServerFilterState,
  isRankedFilterActive, isServerFilterActive, toggleSetValue,
  SCORE_FILTER_VALUES, EXPERIENCE_BUCKET_OPTIONS, APPLIED_WITHIN_OPTIONS,
} from './ranked-filter-helpers';
import type { RankedFilterState, ScoreFilterValue, ServerFilterState } from './ranked-filter-helpers';
import type { Stage, ApplicantFacets } from '@/types/employer-applicants';
import RankedFilterSection, { FilterOptionRow } from './RankedFilterSection';
import RankedSkillsFilter from './RankedSkillsFilter';

const SEARCH_DEBOUNCE_MILLISECONDS = 300;

export const SCORE_DOT_COLOR: Record<ScoreFilterValue, string> = {
  strong: 'var(--cat-green)', good: 'var(--cat-blue)', partial: 'var(--cat-amber)',
  weak: 'var(--cat-orange)', poor: 'var(--cat-red)', unscored: 'var(--ink-faint)',
};
const SCORE_LABEL: Record<ScoreFilterValue, string> = {
  strong: 'Strong (80+)', good: 'Good (60-79)', partial: 'Partial (40-59)',
  weak: 'Weak (20-39)', poor: 'Poor (<20)', unscored: 'Unscored',
};

export default function RankedFilterSidebar({
  value, onChange, serverValue, onServerChange, stages, facets, stageCounts, scoreCounts,
}: {
  value: RankedFilterState;
  onChange: (next: RankedFilterState) => void;
  serverValue: ServerFilterState;
  onServerChange: (next: ServerFilterState) => void;
  stages: Stage[];
  facets: ApplicantFacets;
  stageCounts: ReadonlyMap<string, number>;
  scoreCounts: ReadonlyMap<ScoreFilterValue, number>;
}) {
  // Debounced search: the parent only sees settled text (matches old behaviour).
  const [searchDraft, setSearchDraft] = useState(value.searchText);
  useEffect(() => {
    if (searchDraft === value.searchText) return;
    const timer = setTimeout(() => onChange({ ...value, searchText: searchDraft }), SEARCH_DEBOUNCE_MILLISECONDS);
    return () => clearTimeout(timer);
  }, [searchDraft, value, onChange]);
  useEffect(() => { setSearchDraft(value.searchText); }, [value.searchText]);

  const anyActive = isRankedFilterActive(value) || isServerFilterActive(serverValue);
  const clearAll = () => {
    setSearchDraft('');
    onChange(createInitialRankedFilterState());
    onServerChange(createInitialServerFilterState());
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <Search size={13} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }} />
        <input
          type="search"
          aria-label="Search name or email"
          placeholder="Search name or email"
          value={searchDraft}
          onChange={(event) => setSearchDraft(event.target.value)}
          style={{
            width: '100%', padding: '6px 8px 6px 26px', border: '0.5px solid var(--border)',
            borderRadius: 8, fontSize: 13, background: 'var(--surface-raised)', color: 'var(--ink)',
          }}
        />
      </div>

      <RankedFilterSection label="Stage" defaultOpen>
        {stages.map((stage) => (
          <FilterOptionRow
            key={stage.id} label={stage.text} count={stageCounts.get(stage.id) ?? 0}
            checked={value.stageIds.has(stage.id)}
            onToggle={() => onChange({ ...value, stageIds: toggleSetValue(value.stageIds, stage.id) })}
          />
        ))}
      </RankedFilterSection>

      <RankedFilterSection label="Score" defaultOpen>
        {SCORE_FILTER_VALUES.map((score) => (
          <FilterOptionRow
            key={score} label={SCORE_LABEL[score]} count={scoreCounts.get(score) ?? 0}
            dotColor={SCORE_DOT_COLOR[score]}
            checked={value.scoreValues.has(score)}
            onToggle={() => onChange({ ...value, scoreValues: toggleSetValue(value.scoreValues, score) })}
          />
        ))}
      </RankedFilterSection>

      <RankedFilterSection label="Experience">
        {EXPERIENCE_BUCKET_OPTIONS.map((option) => (
          <FilterOptionRow
            key={option.value} label={option.label}
            checked={serverValue.experience.has(option.value)}
            onToggle={() => onServerChange({ ...serverValue, experience: toggleSetValue(serverValue.experience, option.value) })}
          />
        ))}
      </RankedFilterSection>

      <RankedFilterSection label="Skills" suffix={facets.skills.length > 0 ? facets.skills.length : undefined}>
        <RankedSkillsFilter
          skills={facets.skills}
          selected={serverValue.skills}
          onToggle={(skill) => onServerChange({ ...serverValue, skills: toggleSetValue(serverValue.skills, skill) })}
        />
      </RankedFilterSection>

      {facets.cities.length > 0 && (
        <RankedFilterSection label="Location">
          {facets.cities.map((entry) => (
            <FilterOptionRow
              key={entry.city} label={entry.city} count={entry.count}
              checked={serverValue.locations.has(entry.city)}
              onToggle={() => onServerChange({ ...serverValue, locations: toggleSetValue(serverValue.locations, entry.city) })}
            />
          ))}
        </RankedFilterSection>
      )}

      <RankedFilterSection label="Applied">
        {APPLIED_WITHIN_OPTIONS.map((option) => (
          <FilterOptionRow
            key={option.value} type="radio" name="ranked-applied-within" label={option.label}
            checked={serverValue.appliedWithin === option.value}
            onToggle={() => onServerChange({ ...serverValue, appliedWithin: option.value })}
          />
        ))}
      </RankedFilterSection>

      <div style={{ borderTop: '0.5px solid var(--border)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FilterOptionRow label="Include archived" checked={value.includeArchived}
          onToggle={() => onChange({ ...value, includeArchived: !value.includeArchived })} />
        <FilterOptionRow label="Has resume" checked={serverValue.hasResume}
          onToggle={() => onServerChange({ ...serverValue, hasResume: !serverValue.hasResume })} />
        <FilterOptionRow label="Has notes" checked={serverValue.hasNotes}
          onToggle={() => onServerChange({ ...serverValue, hasNotes: !serverValue.hasNotes })} />
      </div>

      {anyActive && (
        <div style={{ marginTop: 10 }}>
          <Button variant="link" size="sm" onClick={clearAll}>Clear all filters</Button>
        </div>
      )}
    </div>
  );
}
