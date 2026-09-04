// FILE: src/components/seeker/home/SpineSeekerVisuals.tsx
// The three seeker-side illustrations for the spine: resume score bars, salary
// bands and the proof-of-work commit grid. Hairline-only, monochrome, static.
// The figures are ILLUSTRATIVE — a picture of what the product shows, not live
// data — which is why they are constants here and not props from the server.
import { COPY } from '../../../theme/brand';

const SCORE_BARS = [92, 74, 68, 83];
const SALARY_BANDS = [
  { percentile: 'P25', value: '₹12L', width: '48%' },
  { percentile: 'P50', value: '₹18L', width: '68%' },
  { percentile: 'P75', value: '₹26L', width: '88%' },
];
// 36 cells, four brightness steps, one white — reads as a contribution graph.
const COMMIT_CELLS = [
  0, 0.08, 0.2, 0.05, 1, 0, 0.12, 0.3, 0.06, 0.18, 0, 0.1,
  0.15, 0, 0.05, 0.28, 0.1, 0.55, 0, 0.12, 0.2, 0.08, 0, 0.16,
  0, 0.06, 0.14, 0.22, 0.4, 0, 0.32, 0.1, 0, 0.18, 0.08, 0.12,
];

export function ResumeScoreVisual() {
  const bars = COPY.home.spine1Bars;
  return (
    <div className="hm-viz">
      <div className="hm-viz__head">
        <span className="hm-viz__label hm-mono">{COPY.home.spine1Label}</span>
        <span className="hm-viz__big hm-serif">79</span>
      </div>
      {bars.map((label, index) => (
        <div key={label} className="hm-bar">
          <span className="hm-bar__label hm-mono">{label}</span>
          <span className="hm-bar__value hm-mono">{SCORE_BARS[index]}%</span>
          <div className="hm-bar__track">
            <div className="hm-bar__fill" style={{ ['--v' as string]: SCORE_BARS[index] / 100 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SalaryBandsVisual() {
  return (
    <div className="hm-viz">
      <div className="hm-viz__head" style={{ flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <span className="hm-viz__big hm-serif" style={{ fontSize: 56 }}>47</span>
        <span className="hm-viz__label hm-mono">{COPY.home.spine2Label}</span>
      </div>
      {SALARY_BANDS.map(band => (
        <div key={band.percentile} className={`hm-band${band.percentile === 'P50' ? ' hm-band--mid' : ''}`}>
          <span className="hm-band__p hm-mono">{band.percentile}</span>
          <div className="hm-band__track">
            <div className="hm-band__fill" style={{ ['--v' as string]: band.width }} />
          </div>
          <span className="hm-band__v hm-mono">{band.value}</span>
        </div>
      ))}
    </div>
  );
}

export function ProofOfWorkVisual() {
  return (
    <div className="hm-viz">
      <div className="hm-viz__head">
        <div>
          <div className="hm-viz__big hm-serif" style={{ fontSize: 30 }}>1,247</div>
          <div className="hm-viz__label hm-mono" style={{ marginTop: 6 }}>{COPY.home.spine3Commits}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="hm-viz__big hm-serif" style={{ fontSize: 30 }}>312</div>
          <div className="hm-viz__label hm-mono" style={{ marginTop: 6 }}>{COPY.home.spine3Prs}</div>
        </div>
      </div>
      <div className="hm-cells" aria-hidden="true">
        {COMMIT_CELLS.map((alpha, index) => (
          <span key={index} className="hm-cell" style={{ ['--a' as string]: alpha }} />
        ))}
      </div>
    </div>
  );
}
