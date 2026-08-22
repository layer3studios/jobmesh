// FILE: src/components/seeker/home/TrustStrip.tsx
// Section 3 — the credibility strip, aimed as much at employers who land here
// as at seekers. Deliberately NOT a card: two full-bleed hairlines plus hairline
// dividers, so it reads as page structure rather than as a widget. The contrast
// between the weighty number and the tiny wide-tracked label is the whole design.
import { COPY } from '../../../theme/brand';
import type { HomeCounts } from './shared';

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="hm-metric">
      <div className="font-display hm-metric__value">{value}</div>
      <div className="hm-metric__label hm-mono">{label}</div>
    </div>
  );
}

export default function TrustStrip({ counts }: { counts: HomeCounts }) {
  return (
    <section className="hm-metrics stagger" aria-labelledby="trust-heading">
      <h2 id="trust-heading" className="sr-only">{COPY.home.trustHeading}</h2>
      <Metric value={`${counts.jobCount}+`} label={COPY.home.metricRolesLabel} />
      <Metric value={`${counts.companyCount}+`} label={COPY.home.metricCompaniesLabel} />
      <Metric value={COPY.home.metricFreshValue} label={COPY.home.metricFreshLabel} />
      <Metric value={COPY.home.metricDirectValue} label={COPY.home.metricDirectLabel} />
    </section>
  );
}
