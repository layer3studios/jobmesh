import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ScoreSelector from '@/components/employer/jobs/parts/ScoreSelector';

function renderSelector(value: number | null = null) {
  const onChange = vi.fn();
  const view = render(<ScoreSelector value={value} onChange={onChange} />);
  return { onChange, rerender: view.rerender };
}

const options = () => screen.getAllByRole('radio');
const anchorLine = () => screen.getByRole('status');

beforeEach(() => cleanup());

describe('options', () => {
  it('renders exactly five, labelled with value and adjective', () => {
    renderSelector();
    expect(options()).toHaveLength(5);
    expect(screen.getByRole('radio', { name: '1 — Poor' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: '3 — Meets bar' })).toBeTruthy();
    expect(screen.getByRole('radio', { name: '5 — Exceptional' })).toBeTruthy();
  });

  it('reports the picked score', () => {
    const { onChange } = renderSelector();
    fireEvent.click(screen.getByRole('radio', { name: '4 — Strong' }));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('marks the selected option checked', () => {
    renderSelector(4);
    expect(screen.getByRole('radio', { name: '4 — Strong' }).getAttribute('aria-checked')).toBe('true');
    expect(screen.getByRole('radio', { name: '3 — Meets bar' }).getAttribute('aria-checked')).toBe('false');
  });
});

describe('the anchor line', () => {
  it('prompts before anything is picked', () => {
    renderSelector();
    expect(anchorLine().textContent).toBe('Pick a score from 1 to 5.');
  });

  it('reflects the selected value', () => {
    renderSelector(2);
    expect(anchorLine().textContent).toBe('2 · Below bar — Works, but misses core requirements');
  });

  // Deciding between 3 and 4 should not require committing to 4 to read what it means.
  it('previews on hover without a selection being made', () => {
    const { onChange } = renderSelector(2);
    fireEvent.mouseEnter(screen.getByRole('radio', { name: '5 — Exceptional' }));
    expect(anchorLine().textContent).toBe("5 · Exceptional — Would raise the team's average");
    expect(onChange).not.toHaveBeenCalled();
  });

  it('reverts to the selected value when the pointer leaves', () => {
    renderSelector(2);
    fireEvent.mouseEnter(screen.getByRole('radio', { name: '5 — Exceptional' }));
    fireEvent.mouseLeave(screen.getByRole('radiogroup'));
    expect(anchorLine().textContent).toBe('2 · Below bar — Works, but misses core requirements');
  });

  it('previews on keyboard focus too', () => {
    renderSelector();
    fireEvent.focus(screen.getByRole('radio', { name: '1 — Poor' }));
    expect(anchorLine().textContent).toBe('1 · Poor — Incomplete, or does not run');
  });
});

describe('the full-scale popover', () => {
  // All five lines permanently would be more chrome than the rest of the form.
  it('is closed by default — only one line is shown', () => {
    renderSelector(3);
    expect(screen.queryByText(/Would raise the team's average/)).toBeNull();
    expect(screen.getByRole('button', { name: 'What the scores mean' }).getAttribute('aria-expanded')).toBe('false');
  });

  it('lists all five anchors when opened', () => {
    renderSelector();
    fireEvent.click(screen.getByRole('button', { name: 'What the scores mean' }));
    expect(screen.getByText(/Incomplete, or does not run/)).toBeTruthy();
    expect(screen.getByText(/Works, but misses core requirements/)).toBeTruthy();
    expect(screen.getByText(/Does what was asked, competently/)).toBeTruthy();
    expect(screen.getByText(/Complete, with good judgement in the details/)).toBeTruthy();
    expect(screen.getByText(/Would raise the team's average/)).toBeTruthy();
  });

  it('toggles closed again', () => {
    renderSelector();
    const trigger = screen.getByRole('button', { name: 'What the scores mean' });
    fireEvent.click(trigger);
    fireEvent.click(trigger);
    expect(screen.queryByText(/Incomplete, or does not run/)).toBeNull();
  });
});

describe('keyboard', () => {
  it('is a single tab stop — a roving tabindex over the group', () => {
    renderSelector(3);
    expect(screen.getByRole('radio', { name: '3 — Meets bar' }).getAttribute('tabindex')).toBe('0');
    expect(screen.getByRole('radio', { name: '1 — Poor' }).getAttribute('tabindex')).toBe('-1');
  });

  it('the first option is reachable when nothing is selected yet', () => {
    renderSelector();
    expect(screen.getByRole('radio', { name: '1 — Poor' }).getAttribute('tabindex')).toBe('0');
  });

  it('arrow right/down moves up the scale', () => {
    const { onChange } = renderSelector(3);
    fireEvent.keyDown(screen.getByRole('radio', { name: '3 — Meets bar' }), { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith(4);
    fireEvent.keyDown(screen.getByRole('radio', { name: '3 — Meets bar' }), { key: 'ArrowDown' });
    expect(onChange).toHaveBeenLastCalledWith(4);
  });

  it('arrow left/up moves down the scale', () => {
    const { onChange } = renderSelector(3);
    fireEvent.keyDown(screen.getByRole('radio', { name: '3 — Meets bar' }), { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('clamps at both ends', () => {
    const { onChange } = renderSelector(1);
    fireEvent.keyDown(screen.getByRole('radio', { name: '1 — Poor' }), { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenCalledWith(1);
    cleanup();

    const five = renderSelector(5);
    fireEvent.keyDown(screen.getByRole('radio', { name: '5 — Exceptional' }), { key: 'ArrowRight' });
    expect(five.onChange).toHaveBeenCalledWith(5);
  });

  it('Enter activates the focused option (native button behaviour)', () => {
    const { onChange } = renderSelector();
    // A <button> fires click on Enter; assert the handler the browser would reach.
    fireEvent.click(screen.getByRole('radio', { name: '2 — Below bar' }));
    expect(onChange).toHaveBeenCalledWith(2);
  });
});

describe('disabled', () => {
  it('disables every option', () => {
    render(<ScoreSelector value={3} disabled onChange={vi.fn()} />);
    for (const option of screen.getAllByRole('radio')) {
      expect((option as HTMLButtonElement).disabled).toBe(true);
    }
  });
});
