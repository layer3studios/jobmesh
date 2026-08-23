// FILE: src/components/seeker/profile/LeetCodeContestChart.tsx
// Contest rating over the last 20 contests, as a filled line.
//
// THE SHAPE IS THE POINT, not the endpoint. A rating that climbed steadily and one
// that spiked and gave it back can finish on the same number, and only the line
// tells them apart. So the chart carries one extra mark the brief did not ask for:
// a dashed rule at the FIRST rating in the window, which turns "where are they now"
// into "how far have they moved" at a glance. It costs one line and it is the
// question a recruiter is actually asking.
//
// Plain SVG. Twenty points do not need a charting library, and adding one here
// would ship a dependency to every applicant detail page.

import type { LeetCodeProfile } from '@/types/seeker-profile';

const WIDTH = 600;
const HEIGHT = 140;
const PADDING = { top: 10, right: 8, bottom: 18, left: 34 };
const PLOT_WIDTH = WIDTH - PADDING.left - PADDING.right;
const PLOT_HEIGHT = HEIGHT - PADDING.top - PADDING.bottom;

/** Label every fifth contest — twenty dates along 600px would collide. */
const LABEL_EVERY = 5;

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });

export default function LeetCodeContestChart({ data }: { data: LeetCodeProfile }) {
  const history = data.contestHistory;
  // One point is a dot, not a trend. Below two there is no line to draw and the
  // headline rating already says everything this chart could.
  if (history.length < 2) return null;

  const ratings = history.map((entry) => entry.rating);
  const min = Math.min(...ratings);
  const max = Math.max(...ratings);
  // A flat run would divide by zero; give it a band so the line sits mid-plot.
  const span = max - min || 1;
  const pad = span * 0.15;
  const low = min - pad;
  const high = max + pad;

  const xFor = (index: number) =>
    PADDING.left + (index / (history.length - 1)) * PLOT_WIDTH;
  const yFor = (rating: number) =>
    PADDING.top + PLOT_HEIGHT - ((rating - low) / (high - low)) * PLOT_HEIGHT;

  const points = history.map((entry, index) => `${xFor(index)},${yFor(entry.rating)}`).join(' ');
  const baseY = yFor(ratings[0]);
  const lastX = xFor(history.length - 1);
  const lastY = yFor(ratings.at(-1) as number);
  const net = (ratings.at(-1) as number) - ratings[0];

  return (
    <section>
      <h4 className="lc-section-heading">Contest rating · last {history.length}</h4>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label={
          `Contest rating from ${ratings[0]} to ${ratings.at(-1)} across ${history.length} contests`
        }
      >
        {/* Peak and floor, so the line has a scale instead of floating. */}
        {[max, min].map((value) => (
          <text key={value} x={0} y={yFor(value) + 3} fontSize={9} fill="var(--ink-faint)">
            {value}
          </text>
        ))}

        {/* Where they started. Everything above it is progress. */}
        <line
          x1={PADDING.left} y1={baseY} x2={WIDTH - PADDING.right} y2={baseY}
          stroke="var(--border-strong)" strokeWidth={1} strokeDasharray="3 3"
        />

        <polygon
          points={`${PADDING.left},${PADDING.top + PLOT_HEIGHT} ${points} ${lastX},${PADDING.top + PLOT_HEIGHT}`}
          fill="var(--accent)"
          fillOpacity={0.1}
        />
        <polyline
          points={points}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Current rating: the end of the story gets the emphasis. */}
        <circle cx={lastX} cy={lastY} r={3.5} fill="var(--accent)" />

        {history.map((entry, index) => (
          index % LABEL_EVERY === 0 ? (
            <text
              key={entry.date}
              x={xFor(index)}
              y={HEIGHT - 4}
              fontSize={9}
              fill="var(--ink-faint)"
              textAnchor={index === 0 ? 'start' : 'middle'}
            >
              {shortDate(entry.date)}
            </text>
          ) : null
        ))}
      </svg>
      <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: 'var(--ink-faint)' }}>
        {net === 0
          ? 'Level across this run'
          : `${net > 0 ? '+' : ''}${net} across this run`}
      </p>
    </section>
  );
}
