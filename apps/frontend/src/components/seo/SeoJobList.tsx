// FILE: src/components/seo/SeoJobList.tsx
// Server-rendered job list for the SEO landing pages. Unlike JobCard (which
// opens the employer's apply URL), every row links to our own /jobs/[id] page,
// so crawlers follow the list into the job pages that carry JobPosting schema.
import Link from 'next/link';
import type { IJob } from '../../types';

const MONO = 'var(--font-jetbrains-mono), ui-monospace, monospace';

function posted(date: string | null): string | null {
  if (!date) return null;
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
  if (Number.isNaN(days)) return null;
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day ago';
  return days < 30 ? `${days} days ago` : null;
}

export default function SeoJobList({ jobs }: { jobs: IJob[] }) {
  if (jobs.length === 0) {
    return (
      <p className="glass" style={{ color: 'var(--ink-muted)', padding: 24, borderRadius: 12, textAlign: 'center' }}>
        No open roles match right now. New jobs arrive daily — <Link href="/jobs">browse all tech jobs</Link>.
      </p>
    );
  }
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
      {jobs.map(job => {
        const when = posted(job.PostedDate || job.createdAt || null);
        return (
          <li key={job._id}>
            <Link href={`/jobs/${job._id}`} className="glass jb-link-card" style={{ display: 'block', padding: '14px 18px', borderRadius: 12, textDecoration: 'none', color: 'inherit' }}>
              <span style={{ display: 'block', fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>{job.JobTitle}</span>
              <span style={{ display: 'block', marginTop: 4, fontSize: 14, color: 'var(--ink-muted)' }}>
                {job.Company}
                {job.Location ? ` · ${job.IsRemote ? 'Remote' : job.Location}` : ''}
                {when ? <span style={{ fontFamily: MONO, fontSize: 12 }}> · {when}</span> : null}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
