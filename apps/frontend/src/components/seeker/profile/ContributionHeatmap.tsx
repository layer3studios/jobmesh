// FILE: src/components/seeker/profile/ContributionHeatmap.tsx
// A year of daily activity as a 53-week grid, GitHub-style. Shared by the LeetCode
// panel (submissions) and the GitHub panel (contributions).
//
// WHY THIS EARNS ITS SPACE: the headline numbers say how much someone has done;
// this says WHEN, and the shape of it is what a totals row cannot show — a steady
// weekly habit and a single frantic fortnight can produce the same "347".
//
// ONE COMPONENT, TWO PROVIDERS. It takes a calendar and a noun, not a profile, so
// neither provider's field names leak in here. That also means the two panels can
// never drift into drawing the same information two different ways.
//
// It is drawn as one SVG with a viewBox and no fixed width, so it scales down to a
// phone rather than forcing the card to scroll. The cells are plain rects: a chart
// library for 371 squares would be more dependency than drawing.

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
 *
 * THE SCALE STARTS AT 0.32, NOT LOWER, because empty cells are a visible muted
 * surface rather than the card itself. At 0.15 the faintest active cell measured
 * 1.02 contrast against that fill in light mode — a one-contribution day would
 * have looked emptier than an empty one, inverting the very thing the chart
 * encodes. These four keep each step at least 1.3 from its neighbour in both themes.
 */
function intensityOf(count: number): number {
  if (count <= 0) return 0;
  if (count <= 2) return 0.32;
  if (count <= 5) return 0.52;
  if (count <= 9) return 0.74;
  return 1;
}

/**
 * Parse either provider's calendar into `{ "YYYY-MM-DD": count }`.
 *
 * TWO KEY FORMATS, because the two APIs disagree: LeetCode sends unix SECONDS as
 * strings, GitHub sends ISO dates. Both are normalised to the ISO day here rather
 * than in either shape function, so a third provider needs no new component and
 * the grid only ever deals in one kind of key. Bad JSON yields an empty map.
 */
function parseCalendar(raw: string): Map<string, number> {
  try {
    const parsed = JSON.parse(raw || '{}') as Record<string, number>;
    const byDay = new Map<string, number>();
    for (const [rawKey, count] of Object.entries(parsed)) {
      // All-digits means unix seconds; anything else is already a date string.
      const date = /^\d+$/.test(rawKey) ? new Date(Number(rawKey) * 1000) : new Date(rawKey);
      if (Number.isNaN(date.getTime())) continue;
      const key = date.toISOString().slice(0, 10);
      // Both bucket by UTC day; sum defensively in case two keys collide.
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

export default function ContributionHeatmap({ calendar, heading, unit, alwaysRender = false }: {
  /** JSON string: unix-seconds or ISO-date keys → count. */
  calendar: string;
  heading: string;
  /** Singular noun for the tooltip and summary — "submission", "contribution". */
  unit: string;
  /** Draw the empty grid rather than nothing when there is no activity at all. */
  alwaysRender?: boolean;
}) {
  const byDay = parseCalendar(calendar);
  // Nothing to draw. LeetCode sometimes returns no calendar at all, and an
  // all-empty grid would claim a year of inactivity we cannot vouch for — so the
  // default is to render nothing. GitHub always sends a real calendar, so its
  // panel opts in: there, empty genuinely means empty and the grid says so.
  if (byDay.size === 0 && !alwaysRender) return null;

  const { cells, months } = buildGrid(byDay);
  const width = LEFT_GUTTER + WEEKS * STEP;
  const height = TOP_GUTTER + DAYS_IN_WEEK * STEP;
  const activeDays = [...byDay.values()].filter((count) => count > 0).length;
  const total = [...byDay.values()].reduce((sum, count) => sum + count, 0);
  const plural = (n: number) => (n === 1 ? unit : `${unit}s`);

  return (
    <section>
      <h4 className="lc-section-heading">{heading}</h4>
      <svg
        className="lc-heatmap-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${total} ${plural(total)} across ${activeDays} active days in the past year`}
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
              // An empty day is a MUTED SURFACE, not a faint accent: the grid has to
              // stay legible as a grid — 53 columns of seven is itself information,
              // showing how far back the record runs and where the gaps fall — but a
              // low-alpha accent would make zero read as "a very small amount".
              fill={intensity === 0 ? 'var(--surface-muted)' : 'var(--accent)'}
              fillOpacity={intensity === 0 ? 1 : intensity}
            >
              <title>{`${cell.count} ${plural(cell.count)} on ${cell.date}`}</title>
            </rect>
          );
        })}
      </svg>
      <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: 'var(--ink-faint)' }}>
        {total.toLocaleString()} {plural(total)} · {activeDays} active days
      </p>
    </section>
  );
}
