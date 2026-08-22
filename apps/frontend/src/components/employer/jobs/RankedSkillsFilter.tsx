'use client';
// FILE: src/components/employer/jobs/RankedSkillsFilter.tsx
// The Skills sidebar section body: mini search, count-sorted checkboxes,
// top 8 by default with "Show all N". Zero-count skills are hidden entirely.

import { useState } from 'react';
import { Button } from '@/components/ui';
import type { ApplicantFacets } from '@/types/employer-applicants';
import { FilterOptionRow } from './RankedFilterSection';

const DEFAULT_VISIBLE_SKILLS = 8;

export default function RankedSkillsFilter({
  skills, selected, onToggle,
}: {
  skills: ApplicantFacets['skills'];
  selected: ReadonlySet<string>;
  onToggle: (skill: string) => void;
}) {
  const [skillSearch, setSkillSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  const needle = skillSearch.trim().toLowerCase();
  const matching = skills
    .filter((entry) => entry.count > 0)
    .filter((entry) => needle === '' || entry.skill.toLowerCase().includes(needle))
    .sort((a, b) => b.count - a.count);
  const visible = showAll || needle !== '' ? matching : matching.slice(0, DEFAULT_VISIBLE_SKILLS);
  const hiddenCount = matching.length - visible.length;

  return (
    <>
      <input
        type="search"
        aria-label="Filter skills"
        placeholder="Filter skills"
        value={skillSearch}
        onChange={(event) => setSkillSearch(event.target.value)}
        style={{
          padding: '5px 8px', border: '0.5px solid var(--border)', borderRadius: 6,
          fontSize: 12, background: 'var(--surface-raised)', color: 'var(--ink)', marginBottom: 4,
        }}
      />
      {/* Scroll box: "Show all" reveals the rest inside this 200px viewport
          instead of growing the section to full height. */}
      <div className="panel-scroll" style={{ maxHeight: 200, overflowY: 'auto' }}>
        {visible.map((entry) => (
          <FilterOptionRow
            key={entry.skill}
            label={entry.skill}
            count={entry.count}
            checked={selected.has(entry.skill)}
            onToggle={() => onToggle(entry.skill)}
          />
        ))}
      </div>
      {hiddenCount > 0 && (
        <div><Button variant="link" size="sm" onClick={() => setShowAll(true)}>Show all {matching.length}</Button></div>
      )}
    </>
  );
}
