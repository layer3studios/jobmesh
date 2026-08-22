// FILE: src/components/seeker/home/JobsFeed.tsx
// Section 7 — the freshest listings. Dense by design: this is the fast part of
// the page's rhythm. Rendered with the shared <JobCard/> UNCHANGED so the
// homepage and the /jobs feed stay visually identical.
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { COPY } from '../../../theme/brand';
import type { IJob } from '../../../types';
import JobCard from '../JobCard';
import { SectionHeader } from './shared';

interface Props {
  jobs: IJob[];
  /** Total active roles — the trailing CTA advertises the real number. */
  jobCount: number;
}

export default function JobsFeed({ jobs, jobCount }: Props) {
  if (jobs.length === 0) return null; // backend hiccup → hide rather than show an empty shell

  return (
    <section className="hm-section hm-jobs" aria-labelledby="jobs-heading">
      <SectionHeader
        eyebrow={COPY.home.jobsSectionLabel}
        heading={COPY.home.jobsHeading}
        headingId="jobs-heading"
        linkHref="/jobs"
        linkLabel={COPY.home.viewAll}
      />

      <div className="hm-jobs__list stagger">
        {jobs.map(j => <JobCard key={j._id} job={j} />)}
      </div>

      <div className="hm-jobs__more">
        <Link href="/jobs" className="hm-ghost hm-mono">
          {COPY.home.browseAllPrefix} {jobCount} {COPY.home.browseAllSuffix}
          <ArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
