// FILE: src/components/seeker/JobDetailPanel/Overview.tsx
// The job's facts as a key / value table: where, how, how senior, how much,
// when, and where the listing came from. A missing fact says so quietly
// ("Not disclosed") rather than vanishing — the seeker should know we looked.
import { MapPin, Laptop, Layers, IndianRupee, CalendarDays, Link2, Briefcase, GraduationCap } from 'lucide-react';
import type { ReactNode } from 'react';
import type { IJob } from '../../../types';
import { getAutoTags, inferWorkplace, relTime, salaryText } from './job-detail-helpers';

interface Row { key: string; icon: ReactNode; label: string; value: string | null; muted?: boolean }

export default function Overview({ job }: { job: IJob }) {
  const auto = getAutoTags(job);
  const wp = inferWorkplace(job);
  const salary = salaryText(job);
  const posted = relTime(job.PostedDate || job.createdAt || job.scrapedAt || null);
  const contract = job.ContractType && job.ContractType !== 'N/A' ? job.ContractType : null;
  const source = job.ATSPlatform || job.sourceSite || null;

  const rows: Row[] = [
    { key: 'loc', icon: <MapPin size={11} />, label: 'Location', value: job.Location || null },
    { key: 'mode', icon: <Laptop size={11} />, label: 'Work mode', value: wp, muted: !wp },
    { key: 'exp', icon: <Layers size={11} />, label: 'Experience', value: auto.experienceBand ?? (auto.isEntryLevel ? 'Fresher' : null), muted: !auto.experienceBand && !auto.isEntryLevel },
    { key: 'role', icon: <Briefcase size={11} />, label: 'Role', value: auto.roleCategory ?? job.Department ?? null },
    { key: 'sal', icon: <IndianRupee size={11} />, label: 'Salary', value: salary, muted: !salary },
    { key: 'posted', icon: <CalendarDays size={11} />, label: 'Posted', value: posted },
    ...(contract ? [{ key: 'type', icon: <GraduationCap size={11} />, label: 'Type', value: contract }] : []),
    ...(source ? [{ key: 'src', icon: <Link2 size={11} />, label: 'Source', value: source }] : []),
  ].filter(r => r.value !== null || r.muted);

  return (
    <dl className="jb-kv" aria-label="Overview">
      {rows.map(r => (
        <div key={r.key} className="jb-kv__row">
          <dt className="jb-kv__k">{r.icon}{r.label}</dt>
          <dd className={`jb-kv__v${r.value ? '' : ' jb-kv__v--muted'}`} style={{ margin: 0 }}>
            {r.value ?? 'Not disclosed'}
          </dd>
        </div>
      ))}
    </dl>
  );
}
