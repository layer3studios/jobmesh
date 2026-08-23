// FILE: tests/components/seeker/LeetCodeStats.test.tsx
// The LeetCode panel renders from shaped data, and — more importantly — leaves out
// the sections a candidate has no data for instead of showing empty headings.
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import LeetCodeStats from '@/components/seeker/profile/LeetCodeStats';
import type { LeetCodeProfile } from '@/types/seeker-profile';

afterEach(cleanup);

/** Roughly the real neal_wu shape, trimmed. */
const profile = (over: Partial<LeetCodeProfile> = {}): LeetCodeProfile => ({
  username: 'neal_wu',
  ranking: 1234,
  totalSolved: 253,
  easySolved: 60,
  mediumSolved: 141,
  hardSolved: 52,
  contestRating: 3686,
  contestsAttended: 51,
  contestGlobalRanking: 12,
  contestTopPercentage: 0,
  contestHistory: Array.from({ length: 6 }, (_, i) => ({
    contestTitle: `Weekly ${i}`,
    rating: 3400 + i * 50,
    ranking: 100 - i,
    date: new Date(Date.UTC(2026, i, 1)).toISOString(),
  })),
  topSkills: [{ name: 'Array', count: 158 }, { name: 'String', count: 62 }],
  languages: [{ name: 'C++', count: 243 }, { name: 'Python3', count: 14 }],
  submissionCalendar: JSON.stringify({
    [Math.floor(Date.now() / 1000) - 86400 * 3]: 4,
    [Math.floor(Date.now() / 1000) - 86400 * 10]: 1,
  }),
  badges: [],
  fetchedAt: new Date().toISOString(),
  ...over,
});

describe('LeetCodeStats', () => {
  it('shows the four headline numbers', () => {
    render(<LeetCodeStats data={profile()} />);
    expect(screen.getByText('253')).toBeTruthy();
    expect(screen.getByText('3,686')).toBeTruthy();
    expect(screen.getByText('51')).toBeTruthy();
    expect(screen.getByText('Problems')).toBeTruthy();
    expect(screen.getByText('Rating')).toBeTruthy();
  });

  it('renders an em dash for a candidate who has never entered a contest', () => {
    render(<LeetCodeStats data={profile({
      contestRating: null, contestsAttended: 0, contestGlobalRanking: null,
      contestTopPercentage: null, contestHistory: [],
    })} />);
    // Rating and Ranking both fall back; Contests is a real 0, not a dash.
    expect(screen.getAllByText('—').length).toBe(2);
    expect(screen.queryByText(/Contest rating/)).toBeNull();
  });

  it('draws one difficulty bar per level, widths proportional to the total', async () => {
    const { container } = render(<LeetCodeStats data={profile()} />);
    const fills = container.querySelectorAll('.lc-bar-fill');
    expect(fills.length).toBe(3);
    expect(screen.getByText('Easy')).toBeTruthy();
    expect(screen.getByText('Medium')).toBeTruthy();
    expect(screen.getByText('Hard')).toBeTruthy();

    // Bars mount at zero width so the CSS transition has a from-state, then grow on
    // the next frame. Wait for that frame before measuring.
    await waitFor(() => {
      const widths = [...fills].map((el) => parseFloat((el as HTMLElement).style.width) || 0);
      // 141 of 253 is the biggest share, so Medium is the widest bar.
      expect(widths[1]).toBeGreaterThan(widths[0]);
      expect(widths[1]).toBeGreaterThan(widths[2]);
      expect(Math.round(widths[1])).toBe(Math.round((141 / 253) * 100));
    });
  });

  it('the counts are readable even before the bars animate', () => {
    // The width is the flourish; the number is the information. If the frame never
    // fires — slow device, no JS — the counts must still be on screen.
    render(<LeetCodeStats data={profile()} />);
    expect(screen.getByText('141')).toBeTruthy();
    expect(screen.getByText('60')).toBeTruthy();
    expect(screen.getByText('52')).toBeTruthy();
  });

  it('a brand-new account still renders three bars rather than hiding the section', () => {
    const { container } = render(<LeetCodeStats data={profile({
      totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0,
      topSkills: [], languages: [], contestHistory: [], submissionCalendar: '{}',
    })} />);
    expect(container.querySelectorAll('.lc-bar-fill').length).toBe(3);
    expect(screen.getByText('By difficulty')).toBeTruthy();
  });

  it('hides skills and languages when there are none', () => {
    render(<LeetCodeStats data={profile({ topSkills: [], languages: [] })} />);
    expect(screen.queryByText('Strongest topics')).toBeNull();
    expect(screen.queryByText('Languages')).toBeNull();
  });

  it('shows skills and the language split when present', () => {
    const { container } = render(<LeetCodeStats data={profile()} />);
    expect(screen.getByText('Strongest topics')).toBeTruthy();
    expect(screen.getByText(/Array/)).toBeTruthy();
    expect(container.querySelectorAll('.lc-lang-bar > div').length).toBe(2);
    expect(screen.getByText(/C\+\+/)).toBeTruthy();
  });

  it('draws the heatmap grid from the submission calendar', () => {
    const { container } = render(<LeetCodeStats data={profile()} />);
    const svg = container.querySelector('.lc-heatmap-svg');
    expect(svg).toBeTruthy();
    // 53 weeks x 7 days.
    expect(svg!.querySelectorAll('rect').length).toBe(371);
    expect(screen.getByText('Activity · past year')).toBeTruthy();
  });

  it('hides the heatmap entirely when LeetCode returned no calendar', () => {
    const { container } = render(<LeetCodeStats data={profile({ submissionCalendar: '{}' })} />);
    expect(container.querySelector('.lc-heatmap-svg')).toBeNull();
    expect(screen.queryByText('Activity · past year')).toBeNull();
  });

  it('survives a malformed calendar instead of throwing', () => {
    const { container } = render(<LeetCodeStats data={profile({ submissionCalendar: 'not json' })} />);
    expect(container.querySelector('.lc-heatmap-svg')).toBeNull();
  });

  it('plots the contest line with a point per contest', () => {
    const { container } = render(<LeetCodeStats data={profile()} />);
    const line = container.querySelector('polyline');
    expect(line).toBeTruthy();
    expect(line!.getAttribute('points')!.trim().split(/\s+/).length).toBe(6);
    expect(container.querySelector('polygon')).toBeTruthy();
  });

  it('needs two contests before it draws a trend', () => {
    const { container } = render(<LeetCodeStats data={profile({
      contestHistory: [{ contestTitle: 'Only', rating: 1500, ranking: 5, date: new Date().toISOString() }],
    })} />);
    expect(container.querySelector('polyline')).toBeNull();
  });

  it('uses only CSS variables for colour, never a literal hex', () => {
    const { container } = render(<LeetCodeStats data={profile()} />);
    expect(container.innerHTML).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
