// FILE: src/components/seeker/profile/LeetCodeHeatmap.tsx
// A year of submissions as a 53-week grid, GitHub-style.
//
// WHY THIS EARNS ITS SPACE: the headline numbers say how much someone has solved;
// this says WHEN, and the shape of it is what a totals row cannot show — a steady
// weekly habit and a single frantic fortnight can produce the same "347 solved".
//
// It is drawn as one SVG with a viewBox and no fixed width, so it scales down to a
// phone rather than forcing the card to scroll. The cells are plain rects: a chart
// library for 371 squares would be more dependency than drawing.

import type { LeetCodeProfile } from '@/types/seeker-profile';

const CELL = 10;
const GAP = 2;
const STEP = CELL + GAP;
const DAYS_IN_WEEK = 7;
const WEEKS = 53;
const LEFT_GUTTER = 22;   // room for the Mon/Wed/Fri labels
const TOP_GUTTER = 14;    // room for the month labels

/** Only three day labels: seven would out-shout the data they annotate. */
const DAY_LABELS: Record<number, string> = { 1: 'Mon', 3: 'Wed', 5: 'Fri' };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Four steps, because more would imply a precision the counts do not have.
 * Opacity on --accent rather than four literal greens: one hue, one token, and it
 * follows the theme into dark mode without a second palette.
 */
function intensityOf(count: number): number {
  if (count <= 0) return 0;
  if (count <= 2) return 0.15;
  if (count <= 5) return 0.35;
  if (count <= 9) return 0.6;
  return 1;
}

/** LeetCode sends `{ "<unix-seconds>": count }` as a STRING. Bad JSON yields no map. */
function parseCalendar(raw: string): Map<string, number> {
  try {
    const parsed = JSON.parse(raw || '{}') as Record<string, number>;
    const byDay = new Map<string, number>();
    for (const [seconds, count] of Object.entries(parsed)) {
      const date = new Date(Number(seconds) * 1000);
      if (Number.isNaN(date.getTime())) continue;
      const key = date.toISOString().slice(0, 10);
      // LeetCode buckets by UTC day; sum defensively in case two keys collide.
      byDay.set(key, (byDay.get(key) ?? 0) + Number(count || 0));
    }
    return byDay;
  } catch {
    return new Map();
  }
}

interface Cell { x: number; y: number; count: number; date: string }

/** The grid runs to the most recent Saturday so the last column is never ragged. */
function buildGrid(byDay: Map<string, number>): { cells: Cell[]; months: Array<{ x: number; label: string }> } {
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  end.setUTCDate(end.getUTCDate() + (6 - end.getUTCDay()));

  const cells: Cell[] = [];
  const months: Array<{ x: number; label: string }> = [];
  let lastMonth = -1;

  for (let week = 0; week < WEEKS; week += 1) {
    for (let day = 0; day < DAYS_IN_WEEK; day += 1) {
      const offset = (WEEKS - 1 - week) * DAYS_IN_WEEK + (6 - day);
      const date = new Date(end);
      date.setUTCDate(date.getUTCDate() - offset);
      const key = date.toISOString().slice(0, 10);
      cells.push({ x: week * STEP, y: day * STEP, count: byDay.get(key) ?? 0, date: key });

      // Label a month above the first column that contains its 1st-to-7th.
      if (day === 0 && date.getUTCMonth() !== lastMonth && date.getUTCDate() <= 7) {
        lastMonth = date.getUTCMonth();
        months.push({ x: week * STEP, label: MONTHS[lastMonth] });
      }
    }
  }
  return { cells, months };
}

export default function LeetCodeHeatmap({ data }: { data: LeetCodeProfile }) {
  const byDay = parseCalendar(data.submissionCalendar);
  // Nothing to draw: an all-empty grid would claim a year of inactivity we cannot
  // actually vouch for, since LeetCode sometimes returns no calendar at all.
  if (byDay.size === 0) return null;

  const { cells, months } = buildGrid(byDay);
  const width = LEFT_GUTTER + WEEKS * STEP;
  const height = TOP_GUTTER + DAYS_IN_WEEK * STEP;
  const activeDays = [...byDay.values()].filter((count) => count > 0).length;
  const total = [...byDay.values()].reduce((sum, count) => sum + count, 0);

  return (
    <section>
      <h4 className="lc-section-heading">Activity · past year</h4>
      <svg
        className="lc-heatmap-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${total} submissions across ${activeDays} active days in the past year`}
      >
        {months.map((month) => (
          <text
            key={`${month.label}-${month.x}`}
            x={LEFT_GUTTER + month.x}
            y={9}
            fontSize={8}
            fill="var(--ink-faint)"
          >
            {month.label}
          </text>
        ))}

        {Object.entries(DAY_LABELS).map(([day, label]) => (
          <text
            key={label}
            x={0}
            y={TOP_GUTTER + Number(day) * STEP + CELL - 1}
            fontSize={8}
            fill="var(--ink-faint)"
          >
            {label}
          </text>
        ))}

        {cells.map((cell) => {
          const intensity = intensityOf(cell.count);
          return (
            <rect
              key={cell.date}
              x={LEFT_GUTTER + cell.x}
              y={TOP_GUTTER + cell.y}
              width={CELL}
              height={CELL}
              rx={2}
              // An empty day is the surface itself, not a faint accent: zero should
              // read as absence rather than as a very small amount.
              fill={intensity === 0 ? 'var(--surface)' : 'var(--accent)'}
              fillOpacity={intensity === 0 ? 1 : intensity}
            >
              <title>{`${cell.count} submission${cell.count === 1 ? '' : 's'} on ${cell.date}`}</title>
            </rect>
          );
        })}
      </svg>
      <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: 'var(--ink-faint)' }}>
        {total.toLocaleString()} submissions · {activeDays} active days
      </p>
    </section>
  );
}
