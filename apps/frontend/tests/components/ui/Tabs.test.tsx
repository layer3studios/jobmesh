import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Tabs, type TabItem } from '@/components/ui/Tabs';

const tabs: TabItem[] = [
  { id: 'one', label: 'One', content: <p>Panel one</p> },
  { id: 'two', label: 'Two', content: <p>Panel two</p> },
];

describe('Tabs', () => {
  it('renders the tab triggers', () => {
    render(<Tabs tabs={tabs} />);
    expect(screen.getByText('One')).toBeTruthy();
    expect(screen.getByText('Two')).toBeTruthy();
  });

  it('shows the first tab content by default', () => {
    render(<Tabs tabs={tabs} />);
    expect(screen.getByText('Panel one')).toBeTruthy();
    expect(screen.queryByText('Panel two')).toBeNull();
  });

  it('switches active content when a tab is clicked', () => {
    render(<Tabs tabs={tabs} />);
    fireEvent.click(screen.getByText('Two'));
    expect(screen.getByText('Panel two')).toBeTruthy();
    expect(screen.queryByText('Panel one')).toBeNull();
    const tabTwo = screen.getByText('Two').closest('button') as HTMLButtonElement;
    expect(tabTwo.getAttribute('aria-selected')).toBe('true');
  });
});
