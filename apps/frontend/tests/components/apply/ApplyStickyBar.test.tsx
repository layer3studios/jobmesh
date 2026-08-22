// FILE: tests/components/apply/ApplyStickyBar.test.tsx
// The fixed bottom bar. The load-bearing assertions are that it is never on
// screen at the same time as the in-form button, and that clicking it submits
// exactly once — it shares the in-form handler and the in-flight guard, so a
// second submit path would show up here as a second call.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';

vi.mock('@/lib/posthog', () => ({ getPostHogClient: () => null }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  // ApplyFormClient reads ?source= to pre-answer the "how did you hear about us" field.
  useSearchParams: () => new URLSearchParams(),
}));

const submitApplicationMock = vi.fn(async () => ({ applicationId: 'app-1' }));
vi.mock('@/api/public-api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/public-api')>()),
  submitApplication: (...args: unknown[]) => submitApplicationMock(...(args as [])),
}));

import ApplyFormClient from '@/components/apply/ApplyFormClient';
import type { PublicAssignment, PublicCompany, PublicJob } from '@/types/public-apply';

const company = { name: 'Acme', slug: 'acme' } as unknown as PublicCompany;
const job = { id: 'job-1', slug: 'dev', title: 'Staff Engineer', description: 'Build things.' } as unknown as PublicJob;
const assignment = {
  id: 'asg-1', title: 'Build a rate limiter', estimatedHours: 3,
  publicSummary: 'A small service.', allowedFileTypes: [],
} as unknown as PublicAssignment;

const realIntersectionObserver = globalThis.IntersectionObserver;

/** Captures the observer callbacks so a test can drive intersection by hand. */
function installObserverMock() {
  const callbacks: Array<(entries: Array<{ isIntersecting: boolean }>) => void> = [];
  class MockObserver {
    constructor(cb: (entries: Array<{ isIntersecting: boolean }>) => void) { callbacks.push(cb); }
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.IntersectionObserver = MockObserver as unknown as typeof IntersectionObserver;
  return {
    /** Report the in-form button as on/off screen. */
    setInView(inView: boolean) {
      act(() => { for (const cb of callbacks) cb([{ isIntersecting: inView }]); });
    },
  };
}

function scrollPastHeader() {
  act(() => {
    Object.defineProperty(window, 'scrollY', { value: 800, configurable: true, writable: true });
    window.dispatchEvent(new Event('scroll'));
  });
}

function renderPlainPosting() {
  return render(<ApplyFormClient company={company} job={job} companySlug="acme" jobSlug="dev" />);
}

function stickyBar() {
  return screen.queryByTestId('apply-sticky-bar');
}

beforeEach(() => {
  submitApplicationMock.mockClear();
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true });
});

afterEach(() => {
  globalThis.IntersectionObserver = realIntersectionObserver;
});

describe('visibility', () => {
  it('is hidden while the in-form submit button is in view', () => {
    const observer = installObserverMock();
    renderPlainPosting();
    scrollPastHeader();
    observer.setInView(true);
    expect(stickyBar()).toBeNull();
  });

  it('is hidden before the user has scrolled past the header, even off-screen', () => {
    const observer = installObserverMock();
    renderPlainPosting();
    observer.setInView(false);
    // No scroll yet — the bar must not cover content on first paint.
    expect(stickyBar()).toBeNull();
  });

  it('appears once the in-form button scrolls out of view', () => {
    const observer = installObserverMock();
    renderPlainPosting();
    scrollPastHeader();
    observer.setInView(false);
    expect(stickyBar()).toBeTruthy();
  });

  // "Never both visible" cannot be asserted by counting buttons: the in-form
  // button stays in the DOM when it scrolls away, and jsdom has no viewport to
  // scroll. The invariant that IS checkable is the one the guard actually
  // enforces — the bar exists if and only if the button is reported out of view.
  it('toggles strictly against the in-form button, in both directions', () => {
    const observer = installObserverMock();
    renderPlainPosting();
    scrollPastHeader();

    observer.setInView(false);
    expect(stickyBar()).toBeTruthy();
    // Exactly one of the two is on screen: the bar, because the button is not.
    expect(screen.getAllByRole('button', { name: /Submit application/i })).toHaveLength(2);

    observer.setInView(true);
    expect(stickyBar()).toBeNull();
    expect(screen.getAllByRole('button', { name: /Submit application/i })).toHaveLength(1);
  });

  it('renders when IntersectionObserver is unavailable, rather than hiding forever', () => {
    // @ts-expect-error — deliberately removing the API to model an old browser.
    delete globalThis.IntersectionObserver;
    renderPlainPosting();
    expect(stickyBar()).toBeTruthy();
  });
});

describe('server rendering', () => {
  // The bar used to read `typeof IntersectionObserver` during the first render.
  // That is always 'undefined' on the server and 'function' in a browser, so the
  // server emitted a bar the client's first pass did not — a hydration mismatch
  // on every apply page, which is what the dev overlay was reporting. The bar is
  // client-only chrome and must render nothing at all on the server.
  it('emits no sticky bar in server-rendered HTML', async () => {
    const { renderToString } = await import('react-dom/server');
    const html = renderToString(
      <ApplyFormClient company={company} job={job} companySlug="acme" jobSlug="dev" />,
    );
    expect(html).not.toContain('apply-sticky-bar');
    // …while the in-form button is present, so a no-JS visitor still has one.
    expect(html).toContain('Submit application');
  });
});

describe('blocked reason', () => {
  it('shows the gate reason from the form when the submission is incomplete', () => {
    const observer = installObserverMock();
    render(
      <ApplyFormClient
        company={company} job={job} companySlug="acme" jobSlug="dev" assignment={assignment}
      />,
    );
    scrollPastHeader();
    observer.setInView(false);
    const bar = stickyBar() as HTMLElement;
    expect(bar.textContent).toMatch(/Add at least one submission link or file/i);
  });
});

describe('one submit path', () => {
  it('clicking the sticky bar submits exactly once', async () => {
    const observer = installObserverMock();
    const { container } = renderPlainPosting();

    for (const [label, value] of [
      [/First name/i, 'Ada'], [/Last name/i, 'Lovelace'], [/^Email/i, 'ada@example.com'],
    ] as Array<[RegExp, string]>) {
      const field = screen.getByLabelText(label);
      fireEvent.change(field, { target: { value } });
      fireEvent.blur(field);
    }
    const resume = container.querySelector('input[type="file"][accept*="pdf"]') as HTMLInputElement;
    fireEvent.change(resume, {
      target: { files: [new File(['x'], 'cv.pdf', { type: 'application/pdf' })] },
    });
    fireEvent.click(screen.getAllByRole('checkbox')[0]);

    scrollPastHeader();
    observer.setInView(false);

    const bar = stickyBar() as HTMLElement;
    const button = bar.querySelector('button') as HTMLButtonElement;
    expect(button.disabled).toBe(false);

    fireEvent.click(button);
    await waitFor(() => expect(submitApplicationMock).toHaveBeenCalledTimes(1));
  });

  it('a double click still submits only once — the in-flight guard is shared', async () => {
    const observer = installObserverMock();
    const { container } = renderPlainPosting();

    for (const [label, value] of [
      [/First name/i, 'Ada'], [/Last name/i, 'Lovelace'], [/^Email/i, 'ada@example.com'],
    ] as Array<[RegExp, string]>) {
      const field = screen.getByLabelText(label);
      fireEvent.change(field, { target: { value } });
      fireEvent.blur(field);
    }
    const resume = container.querySelector('input[type="file"][accept*="pdf"]') as HTMLInputElement;
    fireEvent.change(resume, {
      target: { files: [new File(['x'], 'cv.pdf', { type: 'application/pdf' })] },
    });
    fireEvent.click(screen.getAllByRole('checkbox')[0]);

    scrollPastHeader();
    observer.setInView(false);

    const button = (stickyBar() as HTMLElement).querySelector('button') as HTMLButtonElement;
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(submitApplicationMock).toHaveBeenCalledTimes(1));
  });
});
