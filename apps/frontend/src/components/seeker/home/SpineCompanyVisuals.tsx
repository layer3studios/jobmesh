// FILE: src/components/seeker/home/SpineCompanyVisuals.tsx
// The three company-side illustrations for the spine: the AI-ranked list, the
// pipeline stages and the shared availability grid. Same rules as the seeker
// visuals — hairline-only, monochrome, illustrative constants, not live data.
import { COPY } from '../../../theme/brand';

const RANKED = [
  { initials: 'PS', name: 'Priya S.', score: 92 },
  { initials: 'AM', name: 'Arjun M.', score: 87 },
  { initials: 'NR', name: 'Neha R.', score: 74 },
];
const PIPELINE: { count: number; chips: string[]; more?: number }[] = [
  { count: 8, chips: ['Priya S.', 'Arjun M.'], more: 6 },
  { count: 3, chips: ['Neha R.', 'Rohan K.'] },
  { count: 1, chips: ['Karan T.'] },
];
// 4 rows × 5 days of availability; brightness = how many interviewers are free.
const SLOTS = [
  0, 0.18, 0, 0.32, 0,
  0.22, 0, 0, 0.14, 0,
  0, 0.26, -1, 0, 0.3,
  0.16, 0, 0.2, 0, 0,
];

export function RankedVisual() {
  return (
    <div className="hm-viz">
      {RANKED.map(candidate => (
        <div key={candidate.name} className="hm-rank">
          <span className="hm-rank__avatar hm-mono">{candidate.initials}</span>
          <div>
            <div className="hm-rank__name">{candidate.name}</div>
            <div className="hm-rank__track">
              <div className="hm-rank__fill" style={{ ['--v' as string]: `${candidate.score}%` }} />
            </div>
          </div>
          <span className="hm-rank__score hm-mono">{candidate.score}</span>
        </div>
      ))}
    </div>
  );
}

export function PipelineVisual() {
  const stages = COPY.home.spine5Stages;
  return (
    <div className="hm-viz">
      {PIPELINE.map((stage, index) => (
        <div key={stages[index]} className="hm-stage">
          <div className="hm-stage__head hm-mono">
            <span>{stages[index]}</span>
            <span>({stage.count})</span>
          </div>
          <div className="hm-stage__chips">
            {stage.chips.map(name => (
              <span key={name} className={`hm-chip${index === PIPELINE.length - 1 ? ' hm-chip--white' : ''}`}>
                {name}
              </span>
            ))}
            {stage.more ? <span className="hm-chip hm-mono">+{stage.more}</span> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AvailabilityVisual() {
  const days = COPY.home.spine6Days;
  return (
    <div className="hm-viz" style={{ maxWidth: 360 }}>
      <div className="hm-days" aria-hidden="true">
        {days.map((day, index) => <span key={`${day}${index}`} className="hm-days__h hm-mono">{day}</span>)}
        {SLOTS.map((alpha, index) => (
          <span
            key={index}
            className={`hm-slot${alpha < 0 ? ' hm-slot--on' : ''}`}
            style={alpha >= 0 ? { ['--a' as string]: alpha } : undefined}
          />
        ))}
      </div>
    </div>
  );
}
