'use client';
// FILE: src/components/seeker/today/PicksSection.tsx
import { Sparkles } from 'lucide-react';
import type { IJob } from '../../../types';
import JobCard from '../JobCard';
import { SectionHead } from './shared';

interface Props {
  picks: IJob[];
  loading: boolean;
  userSkillsLength: number;
  onOpenSkillsEditor: () => void;
}

export default function PicksSection({ picks, loading, userSkillsLength, onOpenSkillsEditor }: Props) {
  return (
    <section>
      <SectionHead
        eyebrow={userSkillsLength > 0 ? `${userSkillsLength} skills` : 'Add your skills'}
        title="Picks for you"
        linkLabel="All jobs"
        linkTo="/jobs"
      />
      {userSkillsLength === 0 && (
        <div style={{
          marginBottom: 12, padding: '11px 14px',
          background: 'var(--accent-soft)',
          border: '1px solid var(--accent-mid)', borderRadius: 11,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 10, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={13} /> Add skills to get better matches in the feed
          </span>
          <button onClick={onOpenSkillsEditor} style={{
            padding: '6px 13px', borderRadius: 8,
            background: 'var(--accent)', color: '#fff',
            border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: '0.82rem', fontWeight: 500,
          }}>Add skills</button>
        </div>
      )}
      <div className="stagger" style={{ display: 'grid', gap: 10 }}>
        {loading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 88, borderRadius: 12 }} />
          ))
        ) : picks.length === 0 ? (
          <p style={{ color: 'var(--ink-muted)', fontSize: '0.875rem', padding: 16, textAlign: 'center' }}>
            No jobs available right now.
          </p>
        ) : (
          picks.map(j => <JobCard key={j._id} job={j} />)
        )}
      </div>
    </section>
  );
}
