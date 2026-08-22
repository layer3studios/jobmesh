import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactNode } from 'react';

vi.mock('recharts', () => {
  const Pass = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  const Nil = () => null;
  return {
    ResponsiveContainer: Pass, LineChart: Pass, Line: Nil, Tooltip: Nil, XAxis: Nil, YAxis: Nil,
    BarChart: Pass, Bar: Pass, Cell: Nil, PieChart: Pass, Pie: Pass, Legend: Nil,
  };
});

import KpiTile from '@/app/(admin)/admin/(app)/analytics/parts/KpiTile';
import SparklineCard from '@/app/(admin)/admin/(app)/analytics/parts/SparklineCard';
import FunnelBarChart from '@/app/(admin)/admin/(app)/analytics/parts/FunnelBarChart';
import PieDistribution from '@/app/(admin)/admin/(app)/analytics/parts/PieDistribution';
import TimeRangeSelector from '@/app/(admin)/admin/(app)/analytics/parts/TimeRangeSelector';

describe('analytics parts (smoke)', () => {
  it('KpiTile renders label, formatted value, and hint', () => {
    render(<KpiTile label="Visitors" value={1234} hint="last 7 days" />);
    expect(screen.getByText('Visitors')).toBeTruthy();
    expect(screen.getByText('1,234')).toBeTruthy();
    expect(screen.getByText('last 7 days')).toBeTruthy();
  });

  it('SparklineCard renders its title and total', () => {
    render(<SparklineCard title="Visitors / day" data={[{ date: 'a', count: 2 }, { date: 'b', count: 3 }]} />);
    expect(screen.getByText('Visitors / day')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
  });

  it('FunnelBarChart renders its title without throwing', () => {
    render(<FunnelBarChart title="Seeker conversion" stages={[{ stage: 'apply_started', count: 3 }]} />);
    expect(screen.getByText('Seeker conversion')).toBeTruthy();
  });

  it('PieDistribution renders its title; empty data shows a no-data note', () => {
    const { rerender } = render(<PieDistribution title="By referrer" data={[{ name: 'google', value: 5 }]} />);
    expect(screen.getByText('By referrer')).toBeTruthy();
    rerender(<PieDistribution title="By device" data={[]} />);
    expect(screen.getByText('No data')).toBeTruthy();
  });
});

describe('TimeRangeSelector', () => {
  it('renders all ranges with the active one pressed', () => {
    render(<TimeRangeSelector value="7d" onSelect={vi.fn()} />);
    expect((screen.getByText('7 days') as HTMLButtonElement).getAttribute('aria-pressed')).toBe('true');
    expect((screen.getByText('24h') as HTMLButtonElement).getAttribute('aria-pressed')).toBe('false');
  });

  it('clicking a different range calls onSelect with that value', () => {
    const onSelect = vi.fn();
    render(<TimeRangeSelector value="7d" onSelect={onSelect} />);
    fireEvent.click(screen.getByText('24h'));
    expect(onSelect).toHaveBeenCalledWith('24h');
  });

  it('clicking the currently-active range does not call onSelect', () => {
    const onSelect = vi.fn();
    render(<TimeRangeSelector value="7d" onSelect={onSelect} />);
    fireEvent.click(screen.getByText('7 days'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('isChanging disables every button', () => {
    render(<TimeRangeSelector value="7d" onSelect={vi.fn()} isChanging />);
    ['24h', '7 days', '30 days'].forEach((label) => {
      expect((screen.getByText(label) as HTMLButtonElement).disabled).toBe(true);
    });
  });
});
