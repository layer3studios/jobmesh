'use client';
// FILE: src/components/seeker/PipelineView/index.tsx
import { useMemo, useState } from 'react';
import { Briefcase } from 'lucide-react';
import { groupByCompany, type PipelineJob } from './group-by-company';
import Controls from './Controls';
import GroupCard from './GroupCard';

export type { PipelineJob };

interface Props {
  jobs: PipelineJob[];
  onStageChange: (jobId: string, newStage: string) => void;
}

export default function PipelineView({ jobs, onStageChange }: Props) {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return jobs.filter(j => {
      if (q && !j.company.toLowerCase().includes(q) && !j.jobTitle.toLowerCase().includes(q)) return false;
      if (stageFilter && (j.stage || 'applied') !== stageFilter) return false;
      return true;
    });
  }, [jobs, search, stageFilter]);

  const groups = useMemo(() => groupByCompany(filtered), [filtered]);

  if (jobs.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-muted)' }}>
        <Briefcase size={28} style={{ opacity: 0.4, marginBottom: 8 }} />
        <p style={{ fontSize: '0.92rem' }}>No applications tracked yet.</p>
      </div>
    );
  }

  const toggle = (k: string) => setExpanded(prev => {
    const n = new Set(prev);
    if (n.has(k)) n.delete(k); else n.add(k);
    return n;
  });

  return (
    <div>
      <Controls search={search} stageFilter={stageFilter} setSearch={setSearch} setStageFilter={setStageFilter} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {groups.map(g => (
          <GroupCard
            key={g.company}
            group={g}
            isOpen={expanded.has(g.company)}
            onToggle={() => toggle(g.company)}
            onStageChange={onStageChange}
          />
        ))}
      </div>
    </div>
  );
}
